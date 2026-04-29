import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { redirect } = request.query;
    
    // If there's a redirect URL, pass it in the state parameter
    if (redirect) {
      return {
        state: redirect,
      };
    }
    
    return {};
  }
}
