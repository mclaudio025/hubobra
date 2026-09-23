from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv
import os
import json
import httpx
import openai
import google.generativeai as genai
from datetime import datetime
import asyncio

# Carrega variáveis de ambiente
load_dotenv()

app = FastAPI(
    title="IA Service - Zé da Obra 2.0",
    description="Serviços de IA para assistência em materiais de construção",
    version="2.0.0"
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Configurações
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3001")

# Cache para configurações
settings_cache = {}
cache_timestamp = None
CACHE_DURATION = 300  # 5 minutos

# Modelos Pydantic
class ChatMessage(BaseModel):
    role: str = Field(..., description="Papel da mensagem: user, assistant, system")
    content: str = Field(..., description="Conteúdo da mensagem")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now)

class ChatRequest(BaseModel):
    message: str = Field(..., description="Mensagem do usuário")
    context: Optional[Dict[str, Any]] = Field(default={}, description="Contexto adicional")
    conversation_id: Optional[str] = Field(None, description="ID da conversa")

class ChatResponse(BaseModel):
    response: str = Field(..., description="Resposta do assistente")
    suggestions: List[str] = Field(default=[], description="Sugestões de próximas perguntas")
    products: List[Dict[str, Any]] = Field(default=[], description="Produtos recomendados")
    conversation_id: str = Field(..., description="ID da conversa")

class MaterialCalculationRequest(BaseModel):
    project_type: str = Field(..., description="Tipo de projeto: casa, muro, piso, etc.")
    dimensions: Dict[str, float] = Field(..., description="Dimensões do projeto")
    specifications: Optional[Dict[str, Any]] = Field(default={}, description="Especificações adicionais")

class MaterialCalculationResponse(BaseModel):
    materials: List[Dict[str, Any]] = Field(..., description="Lista de materiais necessários")
    total_cost: float = Field(..., description="Custo total estimado")
    recommendations: List[str] = Field(..., description="Recomendações adicionais")

class ProductRecommendationRequest(BaseModel):
    query: str = Field(..., description="Consulta do usuário")
    category: Optional[str] = Field(None, description="Categoria específica")
    budget_range: Optional[Dict[str, float]] = Field(None, description="Faixa de orçamento")
    project_context: Optional[str] = Field(None, description="Contexto do projeto")

class ProductRecommendationResponse(BaseModel):
    products: List[Dict[str, Any]] = Field(..., description="Produtos recomendados")
    explanation: str = Field(..., description="Explicação da recomendação")
    alternatives: List[Dict[str, Any]] = Field(default=[], description="Alternativas")

# Armazenamento em memória para conversas (em produção, usar Redis)
conversations = {}

# Funções de configuração
async def get_settings():
    """Busca configurações do backend com cache"""
    global settings_cache, cache_timestamp
    
    current_time = datetime.now().timestamp()
    
    # Verificar se o cache ainda é válido
    if cache_timestamp and (current_time - cache_timestamp) < CACHE_DURATION:
        return settings_cache
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BACKEND_URL}/settings")
            if response.status_code == 200:
                settings_list = response.json()
                # Converter lista em dicionário para acesso fácil
                settings_cache = {setting['key']: setting['value'] for setting in settings_list}
                cache_timestamp = current_time
                return settings_cache
            return {}
    except Exception as e:
        print(f"Erro ao buscar configurações: {e}")
        return settings_cache or {}

async def get_setting(key: str, default_value: Any = None):
    """Busca uma configuração específica"""
    settings = await get_settings()
    return settings.get(key, default_value)

async def setup_ai_client():
    """Configura o cliente de IA baseado nas configurações"""
    provider = await get_setting('ai_provider', 'openai')
    
    if provider == 'openai':
        api_key = await get_setting('openai_api_key')
        if api_key:
            openai.api_key = api_key
            return 'openai'
    elif provider == 'gemini':
        api_key = await get_setting('gemini_api_key')
        if api_key:
            genai.configure(api_key=api_key)
            return 'gemini'
    
    return None

async def generate_ai_response_advanced(message: str, context: Dict[str, Any] = {}, conversation_history: List[Dict] = [], found_products: List[Dict[str, Any]] = []) -> str:
    """Gera resposta usando IA configurada"""
    
    provider = await setup_ai_client()
    if not provider:
        return generate_ai_response(message, context, found_products)  # Fallback para resposta simulada
    
    try:
        system_prompt = await get_setting('system_prompt', 'Você é o Zé da Obra 2.0, atendente especialista e vendedor da loja de materiais de construção.')
        temperature = float(await get_setting('ai_temperature', '0.7'))
        max_tokens = int(await get_setting('ai_max_tokens', '1000'))
        model = await get_setting('ai_model', 'gpt-3.5-turbo')
        
        # Preparar mensagens
        messages = [{"role": "system", "content": system_prompt}]
        
        # Adicionar catálogo real encontrado se houver
        if found_products:
            prod_summary = []
            for p in found_products[:5]:
                name = p.get('name', 'Produto')
                price = p.get('price', 0.0)
                brand = p.get('brand', '')
                stock = p.get('stock', 0)
                images = p.get('images', [])
                img_str = f" | {len(images)} foto(s) disponível(is)" if images else ""
                prod_summary.append(f"- {name} (Marca: {brand}) | Preço: R$ {price:.2f} | Estoque: {stock} un{img_str}")
            
            catalog_context = (
                "PRODUTOS ENCONTRADOS NO NOSSO CATÁLOGO EM TEMPO REAL:\n" +
                "\n".join(prod_summary) +
                "\n\nATENÇÃO: Confirme sempre que temos esses produtos em estoque quando o cliente perguntar se tem, quanto custa ou pedir fotos."
            )
            messages.append({"role": "system", "content": catalog_context})
        
        # Adicionar histórico da conversa
        for msg in conversation_history[-10:]:  # Últimas 10 mensagens
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
        
        # Adicionar contexto se disponível
        if context:
            context_str = f"Contexto adicional: {json.dumps(context, ensure_ascii=False)}"
            messages.append({"role": "system", "content": context_str})
        
        # Adicionar mensagem atual
        messages.append({"role": "user", "content": message})
        
        if provider == 'openai':
            response = await openai.ChatCompletion.acreate(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
            
        elif provider == 'gemini':
            model_instance = genai.GenerativeModel(model or 'gemini-pro')
            
            # Converter mensagens para formato do Gemini
            prompt = f"{system_prompt}\n\n"
            if found_products:
                prompt += f"{catalog_context}\n\n"
            prompt += "Conversa:\n"
            for msg in messages[1:]:  # Pular system prompt
                if msg["role"] == "system":
                    continue
                role = "Usuário" if msg["role"] == "user" else "Assistente"
                prompt += f"{role}: {msg['content']}\n"
            
            response = await model_instance.generate_content_async(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens
                )
            )
            return response.text
            
    except Exception as e:
        print(f"Erro na IA: {e}")
        return generate_ai_response(message, context, found_products)  # Fallback

async def log_ai_usage(provider: str, model: str, operation: str, tokens: int, cost: float = None, user_id: str = None, session_id: str = None, success: bool = True, error: str = None):
    """Registra uso da IA no backend"""
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{BACKEND_URL}/ai-usage-logs", json={
                "provider": provider,
                "model": model,
                "operation": operation,
                "tokens": tokens,
                "cost": cost,
                "userId": user_id,
                "sessionId": session_id,
                "success": success,
                "error": error
            })
    except Exception as e:
        print(f"Erro ao registrar uso da IA: {e}")

async def save_conversation_to_backend(conversation_id: str, messages: List[Dict], user_id: str = None, channel: str = "WEB"):
    """Salva conversa no backend"""
    try:
        async with httpx.AsyncClient() as client:
            # Criar conversa
            conversation_data = {
                "sessionId": conversation_id,
                "userId": user_id,
                "channel": channel,
                "status": "ACTIVE"
            }
            
            conv_response = await client.post(f"{BACKEND_URL}/conversations", json=conversation_data)
            if conv_response.status_code == 201:
                conv_id = conv_response.json()["id"]
                
                # Salvar mensagens
                for msg in messages:
                    message_data = {
                        "conversationId": conv_id,
                        "role": msg.get("role", "user").upper(),
                        "content": msg.get("content", ""),
                        "metadata": json.dumps(msg.get("metadata", {})) if msg.get("metadata") else None
                    }
                    await client.post(f"{BACKEND_URL}/conversation-messages", json=message_data)
                    
    except Exception as e:
        print(f"Erro ao salvar conversa: {e}")

async def send_whatsapp_message(phone: str, message: str):
    """Envia mensagem via WhatsApp"""
    try:
        whatsapp_enabled = await get_setting('whatsapp_enabled', False)
        if not whatsapp_enabled:
            return False
            
        api_url = await get_setting('whatsapp_api_url')
        api_token = await get_setting('whatsapp_api_token')
        
        if not api_url or not api_token:
            return False
            
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {api_token}"}
            data = {
                "to": phone,
                "message": message
            }
            
            response = await client.post(api_url, json=data, headers=headers)
            return response.status_code == 200
            
    except Exception as e:
        print(f"Erro ao enviar WhatsApp: {e}")
        return False

# Funções auxiliares
def extract_search_keywords(message: str) -> str:
    """Extrai palavras-chave da mensagem removendo preposições e termos conversacionais"""
    stop_words = {
        'quero', 'gostaria', 'foto', 'fotos', 'imagem', 'imagens', 'ver', 'tem', 
        'voces', 'vocês', 'tem', 'qual', 'preco', 'preço', 'quanto', 'custa', 
        'de', 'da', 'do', 'dos', 'das', 'um', 'uma', 'uns', 'umas', 'o', 'a', 
        'os', 'as', 'para', 'em', 'por', 'favor', 'mostre', 'mostra', 'enviar', 
        'manda', 'olá', 'ola', 'bom', 'dia', 'boa', 'tarde', 'noite', 'sobre'
    }
    words = [w.strip("?,.!;:") for w in message.lower().split()]
    meaningful = [w for w in words if len(w) >= 3 and w not in stop_words]
    return " ".join(meaningful) if meaningful else message.strip("?,.!;:")

async def get_products_from_backend(query: str = "", category: str = "", limit: int = 10):
    """Busca produtos no backend com suporte a extração de keywords e formato flexível"""
    try:
        clean_query = extract_search_keywords(query)
        async with httpx.AsyncClient() as client:
            params = {"limit": limit}
            if clean_query:
                params["search"] = clean_query
            if category:
                params["categoryId"] = category
            
            response = await client.get(f"{BACKEND_URL}/products", params=params, timeout=5.0)
            if response.status_code == 200:
                res_data = response.json()
                if isinstance(res_data, dict):
                    return res_data.get("products") or res_data.get("data") or []
                elif isinstance(res_data, list):
                    return res_data
            return []
    except Exception as e:
        print(f"Erro ao buscar produtos no backend: {e}")
        return []

async def get_categories_from_backend():
    """Busca categorias no backend"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BACKEND_URL}/categories")
            if response.status_code == 200:
                return response.json()
            return []
    except Exception as e:
        print(f"Erro ao buscar categorias: {e}")
        return []

def generate_ai_response(message: str, context: Dict[str, Any] = {}, found_products: List[Dict[str, Any]] = []) -> str:
    """Gera resposta contextual usando os produtos reais do catálogo"""
    
    # Se encontrou produtos no catálogo, monta resposta precisa e com preços reais
    if found_products:
        prod_lines = []
        for p in found_products[:4]:
            name = p.get('name', 'Produto')
            price = p.get('price', 0.0)
            brand = p.get('brand')
            brand_str = f" ({brand})" if brand else ""
            stock = p.get('stock', 0)
            stock_str = f" | Estoque: {stock} un" if stock > 0 else " | Sob encomenda"
            prod_lines.append(f"• *{name}*{brand_str} — R$ {price:.2f}{stock_str}")
        
        products_list_str = "\n".join(prod_lines)
        return (
            f"Temos sim! Encontrei no nosso catálogo:\n\n{products_list_str}\n\n"
            f"📸 As fotos e detalhes completos estão disponíveis no card logo abaixo. Deseja adicionar algum ao seu pedido ou calcular o frete?"
        )

    # Base de conhecimento geral sobre materiais de construção
    knowledge_base = {
        "cimento": {
            "info": "O cimento é um material fundamental na construção. Para uma casa de 100m², você precisará de aproximadamente 50 sacos de cimento de 50kg.",
            "products": ["cimento cp ii", "cimento cp iii", "cimento branco"],
            "tips": ["Armazene em local seco", "Use dentro do prazo de validade", "Misture na proporção correta"]
        },
        "tijolo": {
            "info": "Tijolos são essenciais para alvenaria. Para 1m² de parede, você precisa de aproximadamente 25 tijolos de 6 ou 8 furos.",
            "products": ["tijolo cerâmico", "tijolo de concreto", "bloco estrutural"],
            "tips": ["Molhe antes do uso", "Verifique a qualidade", "Calcule 10% a mais para perdas"]
        },
        "tinta": {
            "info": "A tinta protege e embeleza as superfícies. 1 litro de tinta cobre aproximadamente 10-12m² por demão.",
            "products": ["tinta acrílica", "tinta látex", "tinta esmalte"],
            "tips": ["Prepare bem a superfície", "Use primer quando necessário", "Aplique em temperatura adequada"]
        },
        "serra": {
            "info": "As lâminas de serra são ideais para cortes precisos em metais, madeira, PVC ou alvenaria. Trabalhamos com marcas profissionais como Starrett e Norton.",
            "tips": ["Verifique o número de dentes (TPI) para cada material", "Use EPIs durante o corte"]
        },
        "antena": {
            "info": "Trabalhamos com antenas digitais externas e internas de alto ganho (UHF/HDTV) para recepção de sinal digital com máxima nitidez.",
            "tips": ["Para melhor sinal, instale a antena externa em ponto elevado livre de barreiras"]
        }
    }
    
    message_lower = message.lower()
    
    # Detectar intenção de cálculo
    if any(word in message_lower for word in ["quanto", "preciso", "calcular", "quantidade"]):
        return "Para calcular a quantidade exata de materiais, preciso saber mais detalhes sobre seu projeto. Que tipo de construção ou reforma você está planejando e quais as medidas?"
    
    elif any(word in message_lower for word in ["recomenda", "melhor", "qual", "indica"]):
        return "Posso recomendar os melhores produtos para seu projeto! Me conte mais sobre o tipo de aplicação e o que você precisa."
    
    elif any(word in message_lower for word in ["preço", "custo", "valor", "orçamento"]):
        return "Nossos preços são atualizados diariamente com as melhores condições da região. Qual produto você gostaria de cotar agora?"
    
    # Buscar na base de conhecimento
    for material, info in knowledge_base.items():
        if material in message_lower:
            response = f"{info['info']}\n\n"
            if info.get('tips'):
                response += "💡 Dicas importantes:\n"
                for tip in info['tips']:
                    response += f"• {tip}\n"
            return response
    
    # Resposta padrão prestativa
    return (
        "Olá! Sou o Zé da Obra 2.0, seu assistente especializado em materiais de construção.\n\n"
        "Posso ajudar você com:\n"
        "• Consulta de estoque e fotos de produtos\n"
        "• Cálculo de cimento, tijolos, pisos e tintas\n"
        "• Especificações técnicas e orçamentos\n\n"
        "Qual material você procura hoje?"
    )

def calculate_materials(project_type: str, dimensions: Dict[str, float], specifications: Dict[str, Any] = {}) -> Dict[str, Any]:
    """Calcula materiais necessários para um projeto"""
    
    materials = []
    total_cost = 0.0
    recommendations = []
    
    if project_type.lower() == "casa":
        area = dimensions.get("area", 0)
        if area > 0:
            # Cálculos básicos para uma casa
            cement_bags = int(area * 0.5)  # 0.5 sacos por m²
            bricks = int(area * 25)  # 25 tijolos por m²
            sand_m3 = area * 0.1  # 0.1 m³ por m²
            
            materials = [
                {"name": "Cimento CP II 50kg", "quantity": cement_bags, "unit": "sacos", "price": 25.90, "total": cement_bags * 25.90},
                {"name": "Tijolo Cerâmico 6 Furos", "quantity": bricks, "unit": "unidades", "price": 0.45, "total": bricks * 0.45},
                {"name": "Areia Média", "quantity": sand_m3, "unit": "m³", "price": 45.00, "total": sand_m3 * 45.00},
            ]
            
            total_cost = sum(item["total"] for item in materials)
            
            recommendations = [
                "Adicione 10% extra para perdas e quebras",
                "Verifique a qualidade dos materiais antes da compra",
                "Considere contratar um profissional para grandes projetos"
            ]
    
    elif project_type.lower() == "muro":
        length = dimensions.get("length", 0)
        height = dimensions.get("height", 0)
        
        if length > 0 and height > 0:
            area = length * height
            blocks = int(area * 12.5)  # 12.5 blocos por m²
            cement_bags = int(area * 0.3)
            
            materials = [
                {"name": "Bloco de Concreto 14x19x39", "quantity": blocks, "unit": "unidades", "price": 2.50, "total": blocks * 2.50},
                {"name": "Cimento CP II 50kg", "quantity": cement_bags, "unit": "sacos", "price": 25.90, "total": cement_bags * 25.90},
                {"name": "Areia Fina", "quantity": area * 0.05, "unit": "m³", "price": 50.00, "total": area * 0.05 * 50.00},
            ]
            
            total_cost = sum(item["total"] for item in materials)
            
            recommendations = [
                "Faça uma fundação adequada para o muro",
                "Use ferro de construção para reforço",
                "Considere impermeabilização se necessário"
            ]
    
    return {
        "materials": materials,
        "total_cost": total_cost,
        "recommendations": recommendations
    }

# Endpoints
@app.get("/")
async def root():
    return {"message": "Zé da Obra 2.0 - IA Service está rodando!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ia-service"}

@app.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    """Chat com o assistente Zé da Obra 2.0"""
    try:
        # Gerar ID da conversa se não fornecido
        conversation_id = request.conversation_id or f"conv_{datetime.now().timestamp()}"
        
        # Recuperar histórico da conversa
        if conversation_id not in conversations:
            conversations[conversation_id] = []
        
        # Adicionar mensagem do usuário
        user_message = ChatMessage(role="user", content=request.message)
        conversations[conversation_id].append(user_message)
        
        # Preparar histórico para IA
        history = [{"role": msg.role, "content": msg.content} for msg in conversations[conversation_id]]
        
        # 1. Buscar produtos relacionados no backend ANTES da IA
        products = await get_products_from_backend(query=request.message, limit=5)
        
        # 2. Gerar resposta da IA (avançada ou fallback) com o catálogo real
        ai_response = await generate_ai_response_advanced(
            request.message, 
            request.context, 
            history[:-1],  # Excluir a mensagem atual
            found_products=products
        )
        
        # Adicionar resposta do assistente
        assistant_message = ChatMessage(role="assistant", content=ai_response)
        conversations[conversation_id].append(assistant_message)
        
        # Gerar sugestões baseadas no contexto
        suggestions = await generate_suggestions(request.message, request.context)
        
        # Salvar conversa no backend (async)
        asyncio.create_task(save_conversation_to_backend(
            conversation_id, 
            [user_message.dict(), assistant_message.dict()],
            request.context.get('userId'),
            request.context.get('channel', 'WEB')
        ))
        
        return ChatResponse(
            response=ai_response,
            suggestions=suggestions,
            products=products,
            conversation_id=conversation_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no chat: {str(e)}")

async def generate_suggestions(message: str, context: Dict[str, Any] = {}) -> List[str]:
    """Gera sugestões contextuais"""
    message_lower = message.lower()
    
    if any(word in message_lower for word in ["cimento", "concreto", "massa"]):
        return [
            "Qual a diferença entre CP II e CP III?",
            "Como calcular cimento para uma laje?",
            "Qual cimento usar para fundação?",
            "Como armazenar cimento corretamente?"
        ]
    elif any(word in message_lower for word in ["tijolo", "bloco", "alvenaria"]):
        return [
            "Quantos tijolos por metro quadrado?",
            "Tijolo cerâmico ou bloco de concreto?",
            "Como calcular argamassa para assentamento?",
            "Qual a diferença entre tijolo maciço e furado?"
        ]
    elif any(word in message_lower for word in ["tinta", "pintura", "parede"]):
        return [
            "Quantos litros de tinta por metro quadrado?",
            "Qual tinta usar em área externa?",
            "Como preparar a parede para pintura?",
            "Tinta acrílica ou látex?"
        ]
    else:
        return [
            "Como calcular a quantidade de materiais?",
            "Qual o melhor produto para meu orçamento?",
            "Preciso de dicas de instalação",
            "Quais são as marcas mais confiáveis?"
        ]

@app.post("/whatsapp/webhook")
async def whatsapp_webhook(data: Dict[str, Any]):
    """Webhook para receber mensagens do WhatsApp"""
    try:
        # Processar mensagem do WhatsApp
        if "messages" in data:
            for message_data in data["messages"]:
                phone = message_data.get("from")
                message = message_data.get("text", {}).get("body", "")
                
                if phone and message:
                    # Gerar resposta
                    conversation_id = f"whatsapp_{phone}"
                    
                    if conversation_id not in conversations:
                        conversations[conversation_id] = []
                        # Enviar mensagem de boas-vindas
                        welcome_msg = await get_setting('whatsapp_welcome_message', 'Olá! Como posso ajudar?')
                        await send_whatsapp_message(phone, welcome_msg)
                    
                    # Processar mensagem
                    user_message = ChatMessage(role="user", content=message)
                    conversations[conversation_id].append(user_message)
                    
                    # Buscar produtos e gerar resposta da IA
                    products = await get_products_from_backend(query=message, limit=5)
                    history = [{"role": msg.role, "content": msg.content} for msg in conversations[conversation_id]]
                    ai_response = await generate_ai_response_advanced(
                        message, 
                        {"channel": "WHATSAPP"}, 
                        history[:-1],
                        found_products=products
                    )
                    
                    # Adicionar resposta do assistente
                    assistant_message = ChatMessage(role="assistant", content=ai_response)
                    conversations[conversation_id].append(assistant_message)
                    
                    # Enviar resposta via WhatsApp
                    await send_whatsapp_message(phone, ai_response)
                    
                    # Salvar conversa
                    asyncio.create_task(save_conversation_to_backend(
                        conversation_id,
                        [user_message.dict(), assistant_message.dict()],
                        None,
                        "WHATSAPP"
                    ))
        
        return {"status": "success"}
        
    except Exception as e:
        print(f"Erro no webhook WhatsApp: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/calculate-materials", response_model=MaterialCalculationResponse)
async def calculate_project_materials(request: MaterialCalculationRequest):
    """Calcula materiais necessários para um projeto"""
    try:
        result = calculate_materials(
            request.project_type,
            request.dimensions,
            request.specifications
        )
        
        return MaterialCalculationResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no cálculo: {str(e)}")

@app.post("/recommend-products", response_model=ProductRecommendationResponse)
async def recommend_products(request: ProductRecommendationRequest):
    """Recomenda produtos baseado na consulta do usuário"""
    try:
        # Buscar produtos no backend
        products = await get_products_from_backend(
            query=request.query,
            category=request.category or "",
            limit=5
        )
        
        # Filtrar por orçamento se fornecido
        if request.budget_range:
            min_price = request.budget_range.get("min", 0)
            max_price = request.budget_range.get("max", float('inf'))
            products = [p for p in products if min_price <= p.get("price", 0) <= max_price]
        
        # Gerar explicação
        explanation = f"Baseado na sua consulta '{request.query}', encontrei {len(products)} produtos que podem atender suas necessidades."
        
        if request.budget_range:
            explanation += f" Filtrei produtos na faixa de R$ {request.budget_range.get('min', 0):.2f} a R$ {request.budget_range.get('max', 0):.2f}."
        
        # Produtos alternativos (simulado)
        alternatives = products[3:] if len(products) > 3 else []
        
        return ProductRecommendationResponse(
            products=products[:3],
            explanation=explanation,
            alternatives=alternatives
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na recomendação: {str(e)}")

@app.get("/conversation/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Recupera histórico de uma conversa"""
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    
    return {
        "conversation_id": conversation_id,
        "messages": conversations[conversation_id]
    }

@app.delete("/conversation/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Deleta uma conversa"""
    if conversation_id in conversations:
        del conversations[conversation_id]
        return {"message": "Conversa deletada com sucesso"}
    
    raise HTTPException(status_code=404, detail="Conversa não encontrada")

@app.get("/categories")
async def get_construction_categories():
    """Retorna categorias de materiais de construção"""
    categories = await get_categories_from_backend()
    return categories

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)