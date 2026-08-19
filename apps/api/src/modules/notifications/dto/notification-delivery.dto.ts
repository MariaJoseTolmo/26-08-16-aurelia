import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateNotificationDeliveryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  channel: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  destination?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxAttempts?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class RegisterNotificationEmailDeliveryDto {
  @IsEmail()
  @MaxLength(320)
  destination: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class NotificationDeliveryFailureDto {
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  reason: string;

  @IsOptional()
  @IsBoolean()
  bounced?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateNotificationDeepLinkDto {
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(10080)
  expiresInMinutes?: number;
}
