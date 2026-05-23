import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class InstitutionAdminJwtGuard extends AuthGuard('institution-jwt') {}
