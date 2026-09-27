from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv
import os
import json
import math
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

    # Base de conhecimento especializada de engenharia e materiais de construção
    knowledge_base = {
        "cimento": {
            "info": "O cimento CP II ou CP III de 50kg é a base da construção. Para alvenaria com tijolo 8 furos, 1 saco assenta cerca de 5m² de parede (~150 a 180 tijolos). Para reboco, 1 saco rende cerca de 4 a 5m² de emboço.",
            "products": ["Cimento Poty 50kg", "Cimento Apodi 50kg", "Cimento Montes Claros 50kg"],
            "tips": ["Armazene em local seco sobre estrados de madeira", "Nunca use cimento empedrado", "Sempre adicione aditivo plastificante tipo Vedalit para melhor trabalhabilidade e economia"]
        },
        "tijolo": {
            "info": "O Tijolo Cerâmico de 8 Furos (9x19x19 cm) é o padrão brasileiro para alvenaria de vedação. O consumo padrão é de 28 tijolos por m² (já com 10% de margem para quebras e recortes).",
            "products": ["Tijolo Cerâmico 8 Furos", "Tijolo 6 Furos", "Bloco de Concreto 14x19x39"],
            "tips": ["Molhe os tijolos antes do assentamento", "Mantenha a junta de argamassa entre 1,0 e 1,5cm", "Compre 10% a mais para cobrir recortes de portas, janelas e quinas"]
        },
        "areia": {
            "info": "A areia média lavada é essencial para a argamassa de assentamento e contrapiso. Para cada 1m² de parede de alvenaria, utiliza-se 0,03 m³ de areia média (cerca de 6 a 8 carrinhos de mão para cada 12m² de parede).",
            "products": ["Areia Média Lavada m³", "Areia Fina m³", "Areia Grossa m³"],
            "tips": ["Exija areia limpa, sem barro ou matéria orgânica", "Use areia média para alvenaria e fina para acabamento de reboco"]
        },
        "tinta": {
            "info": "Para pintura de paredes, uma lata de 18L/20L de tinta acrílica rende de 100 a 120m² acabados (com 2 demãos). Um galão de 3,6L rende de 20 a 25m² acabados.",
            "products": ["Tinta Acrílica Coral Rende Muito 20L", "Tinta Suvinil Fosco Completo", "Selador Acrílico 3,6L"],
            "tips": ["Aplique sempre 1 demão de selador acrílico em paredes novas antes da tinta", "Respeite o intervalo de 4 horas entre demãos"]
        },
        "piso": {
            "info": "Para assentamento de pisos e porcelanatos, utilize 1 saco de 20kg de argamassa colante para cada 4 a 4,5m² de área. O rejunte rende em média 1kg para cada 3 a 4m².",
            "products": ["Argamassa AC-I", "Argamassa AC-II", "Argamassa AC-III Porcelanatos", "Rejunte Flexível 1kg"],
            "tips": ["Adicione 10% de piso extra para recortes", "Em pisos grandes acima de 60x60cm, use dupla colagem e niveladores"]
        },
        "impermeabilizacao": {
            "info": "A impermeabilização correta evita umidade e trincas. O Vedatop/Sikatop (caixa 18kg) rende de 6 a 9m² com 3 demãos cruzadas. O aditivo líquido tipo Sika 1 consome 1L para cada saco de 50kg de cimento.",
            "products": ["Vedatop Caixa 18kg", "Sika 1 Aditivo 1L / 3,6L", "Manta Asfáltica Kala 10cmx10m"],
            "tips": ["Impermeabilize as primeiras 3 fiadas de tijolos e o alicerce para evitar umidade ascendente"]
        }
    }
    
    message_lower = message.lower()
    
    # Detectar intenção de cálculo
    if any(word in message_lower for word in ["quanto", "preciso", "calcular", "quantidade"]):
        return "Para calcular a quantidade exata de materiais para sua obra, me informe as dimensões (comprimento x altura ou m²) e o tipo de serviço (parede, reboco, contrapiso, piso ou pintura). O Zé da Obra calcula tudo na medida certa!"
    
    elif any(word in message_lower for word in ["recomenda", "melhor", "qual", "indica"]):
        return "Posso recomendar as melhores marcas e materiais para sua obra! Me conte o que você vai construir ou reformar que passo as indicações ideais."
    
    elif any(word in message_lower for word in ["preço", "custo", "valor", "orçamento"]):
        return "Temos as melhores condições em materiais de construção com 10% de desconto no PIX e entrega rápida na obra! Qual produto ou quantidade você gostaria de cotar?"
    
    # Buscar na base de conhecimento
    for material, info in knowledge_base.items():
        if material in message_lower:
            response = f"{info['info']}\n\n"
            if info.get('tips'):
                response += "💡 *Dicas do Zé da Obra:*\n"
                for tip in info['tips']:
                    response += f"• {tip}\n"
            return response
    
    # Resposta padrão prestativa
    return (
        "Olá! Sou o Zé da Obra 2.0, seu especialista técnico em materiais de construção.\n\n"
        "Posso ajudar você com:\n"
        "• Cálculo exato de tijolos, cimento, areia e aditivos\n"
        "• Cotação de pisos, argamassas, tintas e impermeabilizantes\n"
        "• Especificações técnicas e entrega rápida na sua obra\n\n"
        "Qual material ou cálculo você precisa hoje?"
    )

def calculate_materials(project_type: str, dimensions: Dict[str, float], specifications: Dict[str, Any] = {}) -> Dict[str, Any]:
    """Calcula materiais necessários para um projeto com fórmulas precisas da engenharia civil"""
    
    materials = []
    total_cost = 0.0
    recommendations = []
    
    pt = project_type.lower()
    
    # 1. Alvenaria / Parede / Muro / Casa
    if any(k in pt for k in ["parede", "alvenaria", "muro", "casa"]):
        length = dimensions.get("length", 0)
        height = dimensions.get("height", 0)
        area = dimensions.get("area", 0)
        
        if area <= 0 and length > 0 and height > 0:
            area = length * height
            
        if area > 0:
            # Padrão: Tijolo Cerâmico 8 furos 9x19x19 cm (28 un/m² com 10% quebra)
            bricks = int(math.ceil(area * 28))
            # Cimento: 0.20 saco de 50kg por m² de parede
            cement_bags = max(1, int(math.ceil(area * 0.20)))
            # Areia Média: 0.03 m³ por m²
            sand_m3 = round(area * 0.03, 2)
            # Aditivo Plastificante (Vedalit / Sika): 1L a cada 15m²
            additive_liters = max(1, int(math.ceil(area / 15.0)))
            
            materials = [
                {"name": "Tijolo Cerâmico 8 Furos (9x19x19cm)", "quantity": bricks, "unit": "unidades", "price": 0.45, "total": round(bricks * 0.45, 2)},
                {"name": "Cimento Todas as Obras 50kg", "quantity": cement_bags, "unit": "sacos", "price": 42.00, "total": round(cement_bags * 42.00, 2)},
                {"name": "Areia Média Lavada", "quantity": sand_m3, "unit": "m³", "price": 85.00, "total": round(sand_m3 * 85.00, 2)},
                {"name": "Aditivo Plastificante Vedalit 1L", "quantity": additive_liters, "unit": "litros", "price": 18.90, "total": round(additive_liters * 18.90, 2)},
            ]
            
            total_cost = sum(item["total"] for item in materials)
            recommendations = [
                f"Para {area:.1f}m² de parede, são necessários {bricks} tijolos de 8 furos (já com 10% de sobra para recortes).",
                f"A massa de assentamento consome {cement_bags} sacos de cimento de 50kg, {sand_m3}m³ de areia média e {additive_liters}L de plastificante.",
                "Molhe os tijolos antes do assentamento para garantir máxima aderência e evitar trincas.",
                "Não esqueça de impermeabilizar as 3 primeiras fiadas de tijolos para evitar umidade do solo."
            ]
    
    # 2. Reboco / Emboço
    elif any(k in pt for k in ["reboco", "emboco"]):
        area = dimensions.get("area", 0)
        if area <= 0:
            length = dimensions.get("length", 0)
            height = dimensions.get("height", 0)
            if length > 0 and height > 0:
                area = length * height
                
        if area > 0:
            cement_bags = max(1, int(math.ceil(area * 0.25)))
            sand_m3 = round(area * 0.035, 2)
            additive_liters = max(1, int(math.ceil(area / 20.0)))
            
            materials = [
                {"name": "Cimento Todas as Obras 50kg", "quantity": cement_bags, "unit": "sacos", "price": 42.00, "total": round(cement_bags * 42.00, 2)},
                {"name": "Areia Fina Lavada", "quantity": sand_m3, "unit": "m³", "price": 90.00, "total": round(sand_m3 * 90.00, 2)},
                {"name": "Aditivo Plastificante Vedalit 1L", "quantity": additive_liters, "unit": "litros", "price": 18.90, "total": round(additive_liters * 18.90, 2)},
            ]
            total_cost = sum(item["total"] for item in materials)
            recommendations = [
                f"Para {area:.1f}m² de reboco (1 face com ~1,5cm de espessura), utilize {cement_bags} sacos de cimento e {sand_m3}m³ de areia fina.",
                "Se for rebocar ambos os lados da parede, dobre as quantidades.",
                "Faça a cura úmida (molhar o reboco) por 3 dias para evitar fissuras."
            ]
            
    # 3. Contrapiso
    elif any(k in pt for k in ["contrapiso", "piso_concreto"]):
        area = dimensions.get("area", 0)
        if area > 0:
            cement_bags = max(1, int(math.ceil(area * 0.35)))
            sand_m3 = round(area * 0.04, 2)
            gravel_m3 = round(area * 0.04, 2)
            
            materials = [
                {"name": "Cimento Todas as Obras 50kg", "quantity": cement_bags, "unit": "sacos", "price": 42.00, "total": round(cement_bags * 42.00, 2)},
                {"name": "Areia Média/Grossa", "quantity": sand_m3, "unit": "m³", "price": 85.00, "total": round(sand_m3 * 85.00, 2)},
                {"name": "Brita 0 / Brita 1", "quantity": gravel_m3, "unit": "m³", "price": 95.00, "total": round(gravel_m3 * 95.00, 2)},
            ]
            total_cost = sum(item["total"] for item in materials)
            recommendations = [
                f"Para {area:.1f}m² de contrapiso com 5cm de espessura, o traço ideal consome {cement_bags} sacos de cimento, {sand_m3}m³ de areia e {gravel_m3}m³ de brita.",
                "Nivele com taliscas e sarrafeie bem a superfície."
            ]
            
    # 4. Piso / Porcelanato
    elif any(k in pt for k in ["piso", "porcelanato", "ceramica"]):
        area = dimensions.get("area", 0)
        if area > 0:
            floor_m2 = round(area * 1.10, 2)  # +10% recorte
            mortar_bags = max(1, int(math.ceil(area / 4.5)))
            grout_kg = max(1, int(math.ceil(area / 3.5)))
            
            materials = [
                {"name": "Piso / Porcelanato Cerâmico (com 10% sobra)", "quantity": floor_m2, "unit": "m²", "price": 49.90, "total": round(floor_m2 * 49.90, 2)},
                {"name": "Argamassa Colante AC-II 20kg", "quantity": mortar_bags, "unit": "sacos", "price": 24.90, "total": round(mortar_bags * 24.90, 2)},
                {"name": "Rejunte Flexível 1kg", "quantity": grout_kg, "unit": "pcts", "price": 12.50, "total": round(grout_kg * 12.50, 2)},
            ]
            total_cost = sum(item["total"] for item in materials)
            recommendations = [
                f"Para {area:.1f}m² de área útil, compre {floor_m2}m² de piso para cobrir perdas e recortes.",
                f"Consumo de {mortar_bags} sacos de 20kg de argamassa colante e {grout_kg}kg de rejunte.",
                "Utilize espaçadores e niveladores de piso para um assentamento 100% plano."
            ]
            
    # 5. Pintura
    elif any(k in pt for k in ["tinta", "pintura"]):
        area = dimensions.get("area", 0)
        if area > 0:
            # 1 lata 18L rende 110m² com 2 demãos. 1 galão 3.6L rende 22m² com 2 demãos
            cans_18l = int(area // 110)
            rem_area = area % 110
            gallons_3_6l = int(math.ceil(rem_area / 22.0))
            if cans_18l == 0 and gallons_3_6l == 0:
                gallons_3_6l = 1
                
            sealer_gallons = max(1, int(math.ceil(area / 28.0)))
            
            materials = []
            if cans_18l > 0:
                materials.append({"name": "Tinta Acrílica Fosca 18L / 20L", "quantity": cans_18l, "unit": "latas", "price": 299.90, "total": round(cans_18l * 299.90, 2)})
            if gallons_3_6l > 0:
                materials.append({"name": "Tinta Acrílica Fosca 3,6L", "quantity": gallons_3_6l, "unit": "galões", "price": 79.90, "total": round(gallons_3_6l * 79.90, 2)})
            materials.append({"name": "Selador Acrílico 3,6L", "quantity": sealer_gallons, "unit": "galões", "price": 45.00, "total": round(sealer_gallons * 45.00, 2)})
            
            total_cost = sum(item["total"] for item in materials)
            recommendations = [
                f"Para {area:.1f}m² de pintura com 2 demãos completas.",
                "Aplique 1 demão de selador antes da tinta para uniformizar a absorção e economizar tinta."
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