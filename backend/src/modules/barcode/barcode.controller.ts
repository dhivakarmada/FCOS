import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { BarcodeService, BarcodeActionType } from './barcode.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('barcode')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BarcodeController {
  constructor(private readonly barcodeService: BarcodeService) {}

  @Post('generate')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER)
  generateBarcode(@Body('sku') sku: string) {
    return this.barcodeService.generateBarcode(sku);
  }

  @Post('scan')
  @Roles(UserRole.WAREHOUSE_MANAGER, UserRole.STAFF)
  scanBarcode(
    @Request() req,
    @Body() body: {
      code: string;
      actionType: BarcodeActionType;
      warehouseId?: string;
      binId?: string;
      orderId?: string;
      quantity?: number;
    },
  ) {
    const { code, actionType, ...context } = body;
    return this.barcodeService.scanBarcode(code, actionType, context, req.user.vendorId, req.user.id);
  }
}
