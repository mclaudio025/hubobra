import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBannerDto } from "./dto/create-banner.dto";
import { UpdateBannerDto } from "./dto/update-banner.dto";

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  async create(createBannerDto: CreateBannerDto) {
    const { startDate, endDate, ...bannerData } = createBannerDto;

    return this.prisma.banner.create({
      data: {
        ...bannerData,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });
  }

  async findAll(type?: string, active?: boolean) {
    const now = new Date();

    const where = {
      ...(type && { type }),
      ...(active !== undefined && { active }),
      // Filtrar por data se especificado
      ...(active && {
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      }),
    };

    return this.prisma.banner.findMany({
      where,
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });
  }

  async findById(id: string) {
    const banner = await this.prisma.banner.findUnique({
      where: { id },
    });

    if (!banner) {
      throw new NotFoundException("Banner não encontrado");
    }

    return banner;
  }

  async update(id: string, updateBannerDto: UpdateBannerDto) {
    const banner = await this.findById(id);
    const { startDate, endDate, ...bannerData } = updateBannerDto;

    return this.prisma.banner.update({
      where: { id },
      data: {
        ...bannerData,
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
      },
    });
  }

  async remove(id: string) {
    const banner = await this.findById(id);

    return this.prisma.banner.delete({
      where: { id },
    });
  }

  async toggleActive(id: string) {
    const banner = await this.findById(id);

    return this.prisma.banner.update({
      where: { id },
      data: {
        active: !banner.active,
      },
    });
  }

  async updatePositions(bannerIds: string[]) {
    const updates = bannerIds.map((id, index) =>
      this.prisma.banner.update({
        where: { id },
        data: { position: index },
      }),
    );

    return Promise.all(updates);
  }

  async getBannerStats() {
    const [total, active, hero, promotional, department] = await Promise.all([
      this.prisma.banner.count(),
      this.prisma.banner.count({ where: { active: true } }),
      this.prisma.banner.count({ where: { type: "HERO" } }),
      this.prisma.banner.count({ where: { type: "PROMOTIONAL" } }),
      this.prisma.banner.count({ where: { type: "DEPARTMENT" } }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byType: {
        hero,
        promotional,
        department,
      },
    };
  }
}
