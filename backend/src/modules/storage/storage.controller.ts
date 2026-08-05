import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni dans la requête.');
    }
    const mediaUrl = await this.storageService.saveFile(file);
    return {
      message: 'Fichier téléversé avec succès',
      mediaUrl,
    };
  }
}
