import { StorageSharedKeyCredential, BlobServiceClient } from '@azure/storage-blob';
import { BadRequestException, HttpException, HttpStatus, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';
import { ReadSaveFileDto } from './dto/read-file-api.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as Tesseract from 'tesseract.js';
import OpenAI from 'openai';
import { imageToText } from './prompt-gpt/image-to-text'

@Injectable()
export class ApiService {
  private logger = new Logger('ApiService');
  private containerClient;
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  constructor(private readonly httpService: AxiosAdapter) {
    const account = process.env.AZURE_STORAGE_ACCOUNT;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);

    const blobServiceClient = new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      sharedKeyCredential
    );

    this.containerClient = blobServiceClient.getContainerClient(containerName);
  }

  async readSaveFile(readSaveFileDto: ReadSaveFileDto) {
    const imageBuffer = await this.downloadImage(readSaveFileDto.url);
    const filename = path.basename(readSaveFileDto.url);
    const uploadsDir = path.join(__dirname, '..', 'uploads');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const tempFilePath = path.join(uploadsDir, filename);
    fs.writeFileSync(tempFilePath, imageBuffer);
    const uploadedUrl = await this.uploadImage(imageBuffer, filename);
    const text = await imageToText(this.openai, uploadedUrl);
    fs.unlinkSync(tempFilePath);
    console.log('================================');
    console.log(text);
    let data: any;
    if (text.msg.includes('Redeban')) {
      return data = {
        "commerce": "Redeban",
        "numberInvoice": "",
        "date": "",
        "nit": "",
        "total": "",
        "produc": ""
      }
    }
    if (text.msg.startsWith("```json")) {
      try {
        const jsonString = text.msg.replace(/```json\n/, '').replace(/\n```$/, '');
        data = JSON.parse(jsonString);
        console.log('================================');
        console.log(data);
        console.log(data.total);
        console.log(data.total.length);
        console.log(data.total.length < 6);
        if (data.total.length < 6) {
          return data = {
            "commerce": "",
            "numberInvoice": "",
            "date": "",
            "nit": "",
            "total": "",
            "produc": ""
          }
        }
        data.total = this.cleanNumberString(data.total)
        if(data.total.toString().includes(',')) {
          return data = {
            "commerce": "",
            "numberInvoice": "",
            "date": "",
            "nit": "",
            "total": "",
            "produc": ""
          }
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    } else {
      return data = {
        "commerce": "",
        "numberInvoice": "",
        "date": "",
        "nit": "",
        "total": "",
        "produc": ""
      }
    }

    console.log(text);
    return { url: uploadedUrl, ...data };
  }


  cleanNumberString(input: string): number {
    let step1 = input.replace(/\./g, '');
    let step2 = step1.replace(/,/g, '.');
    let result = parseInt(step2);
    return result;
  }

  async downloadImage(url: string): Promise<Buffer> {
    try {
      const headers = {
        Authorization: `Bearer ${process.env.WATI_TOKEN}`
      };
      const response: any = await this.httpService.get(`${process.env.WATI_URL_BASE}/${process.env.WATI_TENAN}/api/v1/getMedia?fileName=${url}`, { headers, responseType: 'arraybuffer' });
      console.log(response);
      if (!response) {
        throw new Error('Response data is undefined');
      }

      return Buffer.from(response, 'binary');
    } catch (error) {
      this.logger.error('Image download failed', error);
      throw new HttpException('Image download failed', HttpStatus.BAD_REQUEST);
    }
  }

  async uploadImage(buffer: Buffer, filename: string): Promise<string> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
    try {
      await blockBlobClient.uploadData(buffer);
      return blockBlobClient.url;
    } catch (error) {
      this.logger.error('Image upload failed', error);
      throw new HttpException('Image upload failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    if (error.code === 'ERR_BAD_REQUEST') throw new NotFoundException(error.response.data);
    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}