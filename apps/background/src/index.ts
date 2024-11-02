import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

export default async function() {
    const nestApp = await NestFactory.create(AppModule);
    await nestApp.init();
    const adapter = nestApp.getHttpAdapter();
    return adapter.getInstance();
}