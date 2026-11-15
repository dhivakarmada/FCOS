import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AutomationService {
  constructor(private readonly prisma: PrismaService) {}

  async getRules() {
    return this.prisma.automationRule.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async createRule(data: { name: string; trigger: string; condition: string; action: string }) {
    // Generate unique ID in pattern AR-XXX
    let attempts = 0;
    let code = '';
    while (attempts < 10) {
      code = `AR-${Math.floor(100 + Math.random() * 900)}`;
      const existing = await this.prisma.automationRule.findUnique({
        where: { id: code },
      });
      if (!existing) break;
      attempts++;
    }

    return this.prisma.automationRule.create({
      data: {
        id: code || undefined, // fallback to auto-cuid if code loop fails
        name: data.name,
        trigger: data.trigger,
        condition: data.condition,
        action: data.action,
        active: true,
      },
    });
  }

  async toggleRule(id: string) {
    const rule = await this.prisma.automationRule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException(`Automation rule ${id} not found`);
    }

    return this.prisma.automationRule.update({
      where: { id },
      data: { active: !rule.active },
    });
  }

  async dryRun(id: string) {
    const rule = await this.prisma.automationRule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException(`Automation rule ${id} not found`);
    }

    const timestamp = new Date();
    const timeString = timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Update executions count and lastExecuted timestamp in rule
    const updatedRule = await this.prisma.automationRule.update({
      where: { id },
      data: {
        executions: { increment: 1 },
        lastExecuted: `${timestamp.toLocaleDateString()} ${timeString}`,
      },
    });

    // Create execution ledger log
    const log = await this.prisma.automationExecutionLog.create({
      data: {
        ruleName: rule.name,
        details: `Dry Run simulated: Triggered on '${rule.trigger}' where ${rule.condition} -> Action: ${rule.action} evaluated mock state successfully.`,
        status: 'DRY_RUN',
      },
    });

    return {
      rule: updatedRule,
      log,
    };
  }

  async deleteRule(id: string) {
    const rule = await this.prisma.automationRule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException(`Automation rule ${id} not found`);
    }

    return this.prisma.automationRule.delete({
      where: { id },
    });
  }

  async getLogs() {
    return this.prisma.automationExecutionLog.findMany({
      orderBy: { time: 'desc' },
    });
  }
}
