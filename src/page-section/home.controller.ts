import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { GetHomeResponseDto } from './dtos/getHome/get-home-response.dto';
import { HomeService } from './services/home.service';

@Controller('home')
export class HomeController {
  constructor(private readonly home: HomeService) {}

  @ApiOperation({ summary: 'Get the public home page content' })
  @ApiOkResponse({ description: 'Home page with its sections', type: GetHomeResponseDto })
  @Public()
  @Get()
  getHome(): Promise<GetHomeResponseDto> {
    return this.home.getHome();
  }
}
