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

  @Get('/headlessTest')
  async headlessTest(): Promise<string> {
    return await this.contractService.headlessTest();
  }

  @Get('/s3ConnectTest')
  async s3ConnectTest(): Promise<string> {
    return await this.contractService.s3ConnectTest();
  }
}
