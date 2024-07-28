import { Body, Controller, Get, Post } from '@nestjs/common';
import { RegistContractReqDto } from './dto/regist.contract.req.dto';
import { ContractService } from './contract.service';

@Controller('contract')
export class ContractController {
  constructor(private contractService: ContractService) {}

  @Post()
  async registContract(
    @Body() registContract: RegistContractReqDto,
  ): Promise<string> {
    return await this.contractService.registContract(registContract);
  }

  @Get()
  async headlessTest(): Promise<string> {
    return await this.contractService.headlessTest();
  }
}
