import { Body, Controller, Post } from '@nestjs/common';

@Controller()
export class MockApiController {
  @Post('mocks/documents/upload')
  async uploadDocument(@Body() body) {
    body.forEach((item) => {
      if (item.file.bytes.length > 100) {
        item.file.bytes = item.file.bytes.slice(0, 100)
          + `...<${item.file.bytes.length - 100} characters more>`;
      }
    });
    console.log(
      'Mock POST /documents/upload received the body:\n',
      JSON.stringify(body)
    );
  }

  @Post('mocks/event')
  async emitEvent(@Body() body) {
    console.log(
      'Mock POST /event received the body:\n',
      JSON.stringify(body),
    );
  }
}
