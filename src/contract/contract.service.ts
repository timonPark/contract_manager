import { Injectable } from '@nestjs/common';
import {
  DataBinding,
  RegistContractReqDto,
  SignPoint,
} from './dto/regist.contract.req.dto';
import _ from 'lodash';
import { S3, S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import Jimp from 'jimp';
import puppeteer from 'puppeteer-core';
import { AppModule } from '../app.module';

@Injectable()
export class ContractService {
  private s3Client = new S3Client({
    region: 'ap-northeast-2',
    credentials: {
      accessKeyId: '',
      secretAccessKey: '',
    },
  });
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
    return _.reduce(
      contractListMap.get(fileName),
      (content, targetKeyValue) => {
        return this.replaceAll(
          content,
          '&' + targetKeyValue.targetPoint,
          targetKeyValue.targetValue,
        );
      },
      htmlContent,
    );
  };

  private setMaps = (
    registContract: RegistContractReqDto,
    contractListMap: Map<string, DataBinding[]>,
    contractSignPointMap: Map<string, SignPoint>,
    readKeyMap: Map<string, string>,
    writeKeyMap: Map<string, string>,
  ) => {
    _.chain(registContract.contract)
      .forEach((contract) => {
        const fileName = contract.fileName;
        contractListMap.set(fileName, contract.dataBinding);
        contractSignPointMap.set(fileName, contract.signPoint);
        readKeyMap.set(fileName, contract.readKey);
        writeKeyMap.set(fileName, contract.writeKey);
      })
      .value();
  };

  private replaceAll = (input, searchValue, replaceValue) => {
    const regex = new RegExp(searchValue, 'g');
    return input.replace(regex, replaceValue);
  };

  private getBufferAtConvertHtmlToPng = async (htmlContent) => {
    // return await nodeHtmlToImage({
    //   html: htmlContent
    // })
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
    for (const contract of registContract.contract) {
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
          await new S3().putObject(
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
      } catch (err) {}
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
