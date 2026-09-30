import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { ConvertQuoteToOrderDto } from './dto/convert-quote-to-order.dto';

@ApiTags('Orçamentos (Quotes)')
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo orçamento' })
  @ApiResponse({ status: 201, description: 'Orçamento criado com sucesso' })
  async create(@Body() createQuoteDto: CreateQuoteDto) {
    return this.quotesService.create(createQuoteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os orçamentos com paginação e busca' })
  async findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.quotesService.findAll({ status, search, skip, take });
  }

  @Get('by-phone/:phone')
  @ApiOperation({ summary: 'Buscar orçamentos pelo telefone/WhatsApp do cliente' })
  async findByPhone(@Param('phone') phone: string) {
    return this.quotesService.findByPhone(phone);
  }

  @Get('my-quotes')
  @ApiOperation({ summary: 'Buscar orçamentos do usuário logado' })
  async findMyQuotes(@Query('userId') userId: string) {
    if (!userId) {
      return [];
    }
    return this.quotesService.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar detalhes de um orçamento pelo ID' })
  async findById(@Param('id') id: string) {
    return this.quotesService.findById(id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Gerar e baixar o PDF oficial do orçamento' })
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const quote = await this.quotesService.findById(id);
    const pdfBuffer = await this.quotesService.generatePdfBuffer(id);

    const filename = `orcamento_${quote.quoteNumber}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
      'Cache-Control': 'no-cache',
    });

    return res.end(pdfBuffer);
  }

  @Post(':id/convert-to-order')
  @ApiOperation({ summary: 'Converter orçamento aprovado em Pedido Oficial' })
  async convertToOrder(
    @Param('id') id: string,
    @Body() convertDto: ConvertQuoteToOrderDto,
  ) {
    return this.quotesService.convertToOrder(id, convertDto);
  }
}
