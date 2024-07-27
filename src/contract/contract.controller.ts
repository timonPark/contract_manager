import { Body, Controller, Post } from '@nestjs/common';
import { RegistContractReqDto } from './dto/regist.contract.req.dto';
import { ContractService } from './contract.service';

@Controller('contract')
export class ContractController {
  constructor(private contractService: ContractService) {}

  @Post()
  registContract(@Body() registContract: RegistContractReqDto): string {
    return this.contractService.registContract(registContract);
  }
}
