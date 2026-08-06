import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Save uploaded file to local disk or S3 bucket
   */
  async saveFile(file: { originalname: string; buffer: Buffer }): Promise<string> {
    const fileExt = path.extname(file.originalname) || '.jpg';
    const fileName = `proof_${Date.now()}_${Math.random().toString(36).substring(7)}${fileExt}`;
    const filePath = path.join(this.uploadDir, fileName);

    await fs.promises.writeFile(filePath, file.buffer);
    this.logger.log(`📸 Fichier preuve sauvegardé sur disque : ${fileName}`);

    // In S3 production mode: upload to AWS S3 bucket and return S3 public URL
    const publicUrl = process.env.S3_BUCKET_URL
      ? `${process.env.S3_BUCKET_URL}/${fileName}`
      : `/uploads/${fileName}`;

    return publicUrl;
  }

  /**
   * Save buffer file (contracts, PDFs) to disk or S3
   */
  async uploadBuffer(relativePath: string, buffer: Buffer, mimeType: string): Promise<string> {
    const fullPath = path.join(this.uploadDir, relativePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await fs.promises.writeFile(fullPath, buffer);
    this.logger.log(`📄 Document contrat sauvegardé : ${relativePath}`);

    return process.env.S3_BUCKET_URL
      ? `${process.env.S3_BUCKET_URL}/${relativePath}`
      : `/uploads/${relativePath}`;
  }
}
