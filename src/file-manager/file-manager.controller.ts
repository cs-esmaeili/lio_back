import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBody, ApiConsumes, ApiCookieAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Permissions } from 'src/authorization/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/authorization/guards/permissions.guard';
import { FileManagerService } from './services/file-manager.service';
import type { FileRecord } from './services/file-manager.service';
import { ListFilesRequestDto } from './dtos/listFiles/list-files-request.dto';
import { ListFilesResponseDto } from './dtos/listFiles/list-files-response.dto';
import { UploadFilesRequestDto } from './dtos/uploadFiles/upload-files-request.dto';
import { UploadFilesResponseDto } from './dtos/uploadFiles/upload-files-response.dto';
import { DeleteFileResponseDto } from './dtos/deleteFile/delete-file-response.dto';
import { CreateFolderRequestDto } from './dtos/createFolder/create-folder-request.dto';
import { CreateFolderResponseDto } from './dtos/createFolder/create-folder-response.dto';
import { DeleteFolderRequestDto } from './dtos/deleteFolder/delete-folder-request.dto';
import { DeleteFolderResponseDto } from './dtos/deleteFolder/delete-folder-response.dto';

const MAX_FILES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface JwtUser {
  userId: number;
  username: string;
  sessionId: string;
}

@Controller('files')
export class FileManagerController {
  constructor(private readonly fileManager: FileManagerService) {}

  @ApiOperation({ summary: 'List files and folders in a directory' })
  @ApiOkResponse({ description: 'Directory entries', type: ListFilesResponseDto })
  @ApiNotFoundResponse({ description: 'Folder not found' })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('file:manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get()
  listFiles(@Query() query: ListFilesRequestDto): Promise<ListFilesResponseDto> {
    return this.fileManager.listFiles(query.path ?? '');
  }

  @ApiOperation({ summary: 'Upload one or more files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Target folder relative path (empty for root)', example: 'images' },
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Uploaded files', type: UploadFilesResponseDto })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('file:manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  @Post('upload')
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[], @Body() body: UploadFilesRequestDto, @Req() req: Request): Promise<UploadFilesResponseDto> {
    const user = req.user as JwtUser;
    const records = await this.fileManager.uploadFiles(files, body.path ?? '', user.userId);
    return { files: records.map((record) => this.toFileDto(record)) };
  }

  @ApiOperation({ summary: 'Create a folder' })
  @ApiBody({ type: CreateFolderRequestDto })
  @ApiCreatedResponse({ description: 'Folder created', type: CreateFolderResponseDto })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('file:manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post('folders')
  createFolder(@Body() body: CreateFolderRequestDto): Promise<CreateFolderResponseDto> {
    return this.fileManager.createFolder(body.path);
  }

  @ApiOperation({ summary: 'Delete a folder and its contents' })
  @ApiOkResponse({ description: 'Folder deleted', type: DeleteFolderResponseDto })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('file:manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete('folders')
  deleteFolder(@Query() query: DeleteFolderRequestDto): Promise<DeleteFolderResponseDto> {
    return this.fileManager.deleteFolder(query.path);
  }

  @ApiOperation({ summary: 'Delete a file by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'File deleted', type: DeleteFileResponseDto })
  @ApiNotFoundResponse({ description: 'File not found' })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('file:manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete(':id')
  deleteFile(@Param('id', ParseIntPipe) id: number): Promise<DeleteFileResponseDto> {
    return this.fileManager.deleteFile(id);
  }

  private toFileDto(record: FileRecord) {
    return {
      id: record.id,
      originalName: record.originalName,
      storedName: record.storedName,
      path: record.path,
      url: `/uploads/${record.path}`,
      mimeType: record.mimeType,
      size: record.size,
      uploaderId: record.uploaderId,
      createdAt: record.createdAt.toISOString(),
    };
  }
}
