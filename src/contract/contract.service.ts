import { Injectable } from '@nestjs/common';
import {
  DataBinding,
  RegistContractReqDto,
  SignPoint,
} from './dto/regist.contract.req.dto';
import { S3, S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import Jimp from 'jimp';
import puppeteer, { Browser, Page } from 'puppeteer-core';
import { AppModule } from '../app.module';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ContractService {
  constructor(private configService: ConfigService) {}
  private s3Config = {
    region: this.configService.get<string>('AWS_REGION'),
    credentials: {
      accessKeyId: this.configService.get<string>('S3_ACCESS_KEY'),
      secretAccessKey: this.configService.get<string>('S3_SECRET_ACCESS_KEY'),
    },
  };
  private s3Client = new S3Client(this.s3Config);
  private s3 = new S3(this.s3Config);
  private stream = (stream, type: any) =>
    new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(type(chunks)));
    });
  streamToStringInValue = (chunks: any) =>
    Buffer.concat(chunks).toString('utf8');

  private getContent = async (bucket, readKey, type: any) => {
    return await this.stream(
      (
        await this.s3Client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: readKey,
          }),
        )
      ).Body,
      type,
    );
  };

  private streamInValue = (chunks: any) => Buffer.concat(chunks);

  private readS3Params = (bucket, readKey) => ({
    Bucket: bucket,
    Key: readKey,
  });

  private writeS3Params = (bucket, writeKey, mergedContractBuffer) => ({
    Bucket: bucket,
    Key: writeKey, //writeKeyMap.get(contract.fileName),
    Body: mergedContractBuffer,
    ContentType: 'image/png',
  });

  private editHtml = (htmlContent, contractListMap, fileName) => {
    return contractListMap.get(fileName).reduce((content, targetKeyValue) => {
      return this.replaceAll(
        content,
        '&' + targetKeyValue.targetPoint,
        targetKeyValue.targetValue,
      );
    }, htmlContent);
  };

  private setMaps = (
    registContract: RegistContractReqDto,
    contractListMap: Map<string, DataBinding[]>,
    contractSignPointMap: Map<string, SignPoint>,
    readKeyMap: Map<string, string>,
    writeKeyMap: Map<string, string>,
  ) => {
    console.log(registContract.contracts);
    for (const contract of registContract.contracts) {
      const fileName = contract.fileName;
      contractListMap.set(fileName, contract.dataBinding);
      contractSignPointMap.set(fileName, contract.signPoint);
      readKeyMap.set(fileName, contract.readKey);
      writeKeyMap.set(fileName, contract.writeKey);
    }
  };

  private replaceAll = (input, searchValue, replaceValue) => {
    const regex = new RegExp(searchValue, 'g');
    return input.replace(regex, replaceValue);
  };

  private getBufferAtConvertHtmlToPng = async (
    htmlContent: string,
  ): Promise<Buffer> => {
    try {
      const browser: Browser = await puppeteer.launch({
        executablePath: this.configService.get<string>('CHROMIUM_PATH'),
        headless: true,
        ignoreHTTPSErrors: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page: Page = await browser.newPage();
      await page.setContent(htmlContent);
      const A4_WIDTH = 794;
      const A4_HEIGHT = 1123;
      await page.setViewport({
        width: A4_WIDTH,
        height: A4_HEIGHT,
        deviceScaleFactor: 1,
      });
      const contractBuffer = await page.screenshot({ type: 'png' });
      await browser.close();
      return contractBuffer;
    } catch (e) {
      console.log(e);
    }
    return null;
  };

  private MergeContractAndSign = async (
    signBuffer: Buffer,
    resultBuffer: Buffer,
    signPoint: SignPoint,
  ) => {
    const signatureJimp = (await Jimp.read(signBuffer)).resize(100, 50);
    const contractJimp = await Jimp.read(resultBuffer);
    const mergedContractJimp = contractJimp.composite(
      signatureJimp,
      signPoint.x,
      signPoint.y,
    );
    return await mergedContractJimp.getBufferAsync(Jimp.MIME_PNG);
  };

  public registContract = async (
    registContract: RegistContractReqDto,
  ): Promise<string> => {
    const contractListMap: Map<string, DataBinding[]> = new Map();
    const contractSignPointMap: Map<string, SignPoint> = new Map();
    const readKeyMap: Map<string, string> = new Map();
    const writeKeyMap: Map<string, string> = new Map();
    this.setMaps(
      registContract,
      contractListMap,
      contractSignPointMap,
      readKeyMap,
      writeKeyMap,
    );
    const bucket: string = registContract.bucket;
    for (const contract of registContract.contracts) {
      const fileName: string = contract.fileName;
      const readKey: string = contract.readKey;
      try {
        const htmlContent: string = this.editHtml(
          await this.getContent(bucket, readKey, this.streamToStringInValue),
          contractListMap,
          fileName,
        );

        const signBuffer = (await this.getContent(
          bucket,
          registContract.signKey,
          this.streamInValue,
        )) as Buffer;

        const resultBuffer: Buffer = await this.getBufferAtConvertHtmlToPng(
          htmlContent,
        );

        const signPoint = contractSignPointMap.get(fileName);

        if (signPoint) {
          // s3 저장
          await this.s3.putObject(
            this.writeS3Params(
              bucket,
              writeKeyMap.get(fileName),
              await this.MergeContractAndSign(
                signBuffer,
                resultBuffer,
                signPoint,
              ),
            ),
          );
        }
      } catch (err) {
        console.log(err);
      }
    }
    return null;
  };

  public headlessTest = async () => {
    try {
      const browser = await puppeteer.launch({
        executablePath: AppModule.CHROMIUM_EXECUTABLE_PATH,
        headless: true,
        ignoreHTTPSErrors: true,
      });
      await browser.newPage();
      await browser.close();
    } catch (e) {
      console.log(e);
      const response = {
        statusCode: 500,
        body: JSON.stringify(e),
      };
    }
    return '성공';
  };

  public s3ConnectTest = async () => {
    const obj = await this.getContent(
      'wellcheck-server-dev2',
      'contract/html_template/application_for_business_participation.html',
      this.streamToStringInValue,
    );
    console.log(obj);
    return '성공';
  };
}
