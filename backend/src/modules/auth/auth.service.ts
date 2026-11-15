import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && !user.deletedAt && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    let designation = null;
    let warehouseId = null;
    let warehouseName = null;

    if (user.role === 'STAFF') {
      const staff = await this.usersService.findStaffByUserId(user.id);
      if (staff) {
        designation = staff.designation;
        warehouseId = staff.warehouseId;
        if (staff.warehouse) {
          warehouseName = staff.warehouse.name;
        }
      }
    }

    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role, 
      vendorId: user.vendorId,
      designation,
      warehouseId,
      warehouseName,
    };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });
    
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        vendorId: user.vendorId,
        designation,
        warehouseId,
        warehouseName,
      }
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      });
      
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      let designation = null;
      let warehouseId = null;
      let warehouseName = null;

      if (user.role === 'STAFF') {
        const staff = await this.usersService.findStaffByUserId(user.id);
        if (staff) {
          designation = staff.designation;
          warehouseId = staff.warehouseId;
          if (staff.warehouse) {
            warehouseName = staff.warehouse.name;
          }
        }
      }

      const newPayload = { 
        email: user.email, 
        sub: user.id, 
        role: user.role, 
        vendorId: user.vendorId,
        designation,
        warehouseId,
        warehouseName,
      };

      return {
        access_token: this.jwtService.sign(newPayload, {
          secret: process.env.JWT_ACCESS_SECRET,
          expiresIn: '15m',
        }),
        refresh_token: this.jwtService.sign(newPayload, {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: '7d',
        }),
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async register(data: any) {
    return this.usersService.create(data);
  }
}
