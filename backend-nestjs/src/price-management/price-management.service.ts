import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as XLSX from "xlsx";

export interface PriceUpdateDto {
  productId: string;
  newPrice: number;
  comparePrice?: number; // Preço "De" para mostrar desconto
  reason?: string;
}

export interface BulkPriceUpdateDto {
  categoryId?: string;
  brand?: string; // Brand é string no schema
  productIds?: string[];
  updateType: "fixed" | "percentage" | "formula";
  value: number;
  reason: string;
  applyToComparePrice?: boolean; // Aplicar ao preço comparativo
}

export interface PriceReportFilter {
  categoryId?: string;
  brand?: string; // Brand é string no schema
  priceRange?: { min: number; max: number };
  lastUpdated?: { from: Date; to: Date };
}

@Injectable()
export class PriceManagementService {
  private readonly logger = new Logger(PriceManagementService.name);

  constructor(private prisma: PrismaService) {}

  async updateSinglePrice(dto: PriceUpdateDto, userId: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
        select: { id: true, name: true, price: true, comparePrice: true },
      });

      if (!product) {
        throw new Error("Produto não encontrado");
      }

      const oldPrice = product.price;
      const updateData: any = {
        price: dto.newPrice,
        updatedAt: new Date(),
      };

      // Atualizar preço comparativo se fornecido
      if (dto.comparePrice !== undefined) {
        updateData.comparePrice = dto.comparePrice;
      }

      const updatedProduct = await this.prisma.product.update({
        where: { id: dto.productId },
        data: updateData,
      });

      await this.createPriceHistory({
        productId: dto.productId,
        oldPrice,
        newPrice: dto.newPrice,
        reason: dto.reason || "Atualização manual",
        userId,
      });

      this.logger.log(
        `Preço atualizado: ${product.name} - R$ ${oldPrice} → R$ ${dto.newPrice}`,
      );
      return updatedProduct;
    } catch (error) {
      this.logger.error("Erro ao atualizar preço:", error);
      throw error;
    }
  }

  async bulkUpdatePrices(dto: BulkPriceUpdateDto, userId: string) {
    try {
      const whereClause: any = {};

      if (dto.categoryId) whereClause.categoryId = dto.categoryId;
      if (dto.brand) whereClause.brand = dto.brand;
      if (dto.productIds?.length > 0) whereClause.id = { in: dto.productIds };

      const products = await this.prisma.product.findMany({
        where: whereClause,
        select: { id: true, name: true, price: true, comparePrice: true },
      });

      if (products.length === 0) {
        throw new Error("Nenhum produto encontrado");
      }

      const updates = [];
      const historyRecords = [];

      for (const product of products) {
        let newPrice = product.price;
        let newComparePrice = product.comparePrice;

        switch (dto.updateType) {
          case "fixed":
            newPrice = dto.value;
            break;
          case "percentage":
            newPrice = product.price * (1 + dto.value / 100);
            if (dto.applyToComparePrice && product.comparePrice) {
              newComparePrice = product.comparePrice * (1 + dto.value / 100);
            }
            break;
          case "formula":
            newPrice = product.price + dto.value;
            break;
        }

        // Arredondar para 2 casas decimais
        newPrice = Math.round(newPrice * 100) / 100;
        if (newComparePrice) {
          newComparePrice = Math.round(newComparePrice * 100) / 100;
        }

        const updateData: any = {
          price: newPrice,
          updatedAt: new Date(),
        };

        if (newComparePrice !== undefined) {
          updateData.comparePrice = newComparePrice;
        }

        updates.push({
          where: { id: product.id },
          data: updateData,
        });

        historyRecords.push({
          productId: product.id,
          oldPrice: product.price,
          newPrice,
          reason: dto.reason,
          userId,
          createdAt: new Date(),
        });
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const updatePromises = updates.map((update) =>
          tx.product.update(update),
        );
        await Promise.all(updatePromises);

        await tx.priceHistory.createMany({ data: historyRecords });
        return { updatedCount: products.length };
      });

      this.logger.log(
        `Preços atualizados em massa: ${result.updatedCount} produtos`,
      );
      return {
        success: true,
        updatedCount: result.updatedCount,
        message: `${result.updatedCount} produtos atualizados com sucesso`,
      };
    } catch (error) {
      this.logger.error("Erro na atualização em massa:", error);
      throw error;
    }
  }

  async generatePriceReport(filters: PriceReportFilter = {}) {
    try {
      const whereClause: any = {};

      if (filters.categoryId) whereClause.categoryId = filters.categoryId;
      if (filters.brand) whereClause.brand = filters.brand;
      if (filters.priceRange) {
        whereClause.price = {
          gte: filters.priceRange.min,
          lte: filters.priceRange.max,
        };
      }
      if (filters.lastUpdated) {
        whereClause.updatedAt = {
          gte: filters.lastUpdated.from,
          lte: filters.lastUpdated.to,
        };
      }

      const products = await this.prisma.product.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          comparePrice: true,
          stock: true,
          active: true,
          updatedAt: true,
          brand: true, // Brand é string, não relação
          category: { select: { name: true } },
        },
        orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
      });

      const stats = {
        totalProducts: products.length,
        averagePrice:
          products.reduce((sum, p) => sum + p.price, 0) / products.length || 0,
        minPrice:
          products.length > 0 ? Math.min(...products.map((p) => p.price)) : 0,
        maxPrice:
          products.length > 0 ? Math.max(...products.map((p) => p.price)) : 0,
        productsWithComparePrice: products.filter((p) => p.comparePrice).length,
        outOfStock: products.filter((p) => p.stock === 0).length,
        inactive: products.filter((p) => !p.active).length,
      };

      return { products, stats, generatedAt: new Date() };
    } catch (error) {
      this.logger.error("Erro ao gerar relatório:", error);
      throw error;
    }
  }

  async exportToExcel(filters: PriceReportFilter = {}) {
    try {
      const report = await this.generatePriceReport(filters);

      const excelData = report.products.map((product) => ({
        ID: product.id,
        SKU: product.sku,
        Nome: product.name,
        Categoria: product.category?.name || "Sem categoria",
        Marca: product.brand || "Sem marca",
        Preço: product.price,
        "Preço Comparativo": product.comparePrice || "",
        Estoque: product.stock,
        Ativo: product.active ? "Sim" : "Não",
        "Última Atualização": product.updatedAt.toLocaleDateString("pt-BR"),
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos");

      // Adicionar estatísticas
      const statsData = [
        ["Estatísticas do Relatório", ""],
        ["Total de Produtos", report.stats.totalProducts],
        ["Preço Médio", `R$ ${report.stats.averagePrice.toFixed(2)}`],
        ["Menor Preço", `R$ ${report.stats.minPrice.toFixed(2)}`],
        ["Maior Preço", `R$ ${report.stats.maxPrice.toFixed(2)}`],
        ["Com Preço Comparativo", report.stats.productsWithComparePrice],
        ["Sem Estoque", report.stats.outOfStock],
        ["Inativos", report.stats.inactive],
        ["Gerado em", report.generatedAt.toLocaleString("pt-BR")],
      ];

      const statsWorksheet = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsWorksheet, "Estatísticas");

      return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    } catch (error) {
      this.logger.error("Erro ao exportar Excel:", error);
      throw error;
    }
  }

  async importFromExcel(buffer: Buffer, userId: string) {
    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const updates = [];
      const errors = [];

      for (let i = 0; i < data.length; i++) {
        const row: any = data[i];

        try {
          const productId = row["ID"];
          const newPrice = parseFloat(row["Preço"]);

          if (!productId || isNaN(newPrice)) {
            errors.push(`Linha ${i + 2}: ID ou preço inválido`);
            continue;
          }

          const product = await this.prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, price: true, name: true },
          });

          if (!product) {
            errors.push(`Linha ${i + 2}: Produto ${productId} não encontrado`);
            continue;
          }

          updates.push({
            productId,
            oldPrice: product.price,
            newPrice,
            productName: product.name,
          });
        } catch (error) {
          errors.push(`Linha ${i + 2}: ${error.message}`);
        }
      }

      if (updates.length === 0) {
        throw new Error("Nenhuma atualização válida encontrada");
      }

      // Executar atualizações
      const result = await this.prisma.$transaction(async (tx) => {
        const updatePromises = updates.map((update) =>
          tx.product.update({
            where: { id: update.productId },
            data: { price: update.newPrice, updatedAt: new Date() },
          }),
        );

        await Promise.all(updatePromises);

        const historyRecords = updates.map((update) => ({
          productId: update.productId,
          oldPrice: update.oldPrice,
          newPrice: update.newPrice,
          reason: "Importação via Excel",
          userId,
          createdAt: new Date(),
        }));

        await tx.priceHistory.createMany({ data: historyRecords });

        return { updatedCount: updates.length };
      });

      return {
        success: true,
        updatedCount: result.updatedCount,
        errors,
        message: `${result.updatedCount} produtos atualizados. ${errors.length} erros encontrados.`,
      };
    } catch (error) {
      this.logger.error("Erro na importação:", error);
      throw error;
    }
  }

  async getPriceHistory(productId: string, limit: number = 50) {
    return this.prisma.priceHistory.findMany({
      where: { productId },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  private async createPriceHistory(data: {
    productId: string;
    oldPrice: number;
    newPrice: number;
    reason: string;
    userId: string;
  }) {
    return this.prisma.priceHistory.create({
      data: {
        productId: data.productId,
        oldPrice: data.oldPrice,
        newPrice: data.newPrice,
        reason: data.reason,
        userId: data.userId,
        createdAt: new Date(),
      },
    });
  }
}
