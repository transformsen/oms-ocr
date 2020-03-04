/**
 * The SubmitJobDto class specifies the schema of POST /job body.
 */

import {
  IsAlphanumeric,
  IsNumberString,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
} from 'class-validator';

import { Type } from 'class-transformer';

class SystemDto {
  @IsString()
  name: string;

  @IsString()
  version: string;

  @IsString()
  stagingEnvironment: string;

  @IsString()
  datacenterEnvironment: string;
}

class UserDto {
  @IsAlphanumeric()
  id: string;
}

class SourceDto {
  @Type(() => SystemDto)
  @ValidateNested()
  system: SystemDto;

  @Type(() => UserDto)
  @ValidateNested()
  user: UserDto;
}

class RequestContextDto {
  @Type(() => SourceDto)
  @ValidateNested()
  source: SourceDto;
}

class RecipientDto {
  @IsString()
  addressee: string;

  @IsString()
  addressLine1: string;

  @IsString()
  addressLine2: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zip: string;

  @IsString()
  zip4: string;
}

class ItemDto {
  @IsString()
  contentType: string;

  @IsOptional()
  @IsString()
  encodingType: string;

  @IsOptional()
  @IsString()
  content: string;
}

class StorageConfDto {
  @IsString()
  locationId: string;

  @IsString()
  locationName: string;
}

class StorageDto {
  @IsString()
  system: string

  @Type(() => StorageConfDto)
  @ValidateNested()
  conf: StorageConfDto;
}

class RelationshipConfDto {
  @IsOptional()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  sourceSystemType: string;

  @IsOptional()
  @IsString()
  catalogId: string;

  @IsOptional()
  @IsString()
  formId: string;
}

class RelationshipDto {
  @IsString()
  type: string;

  @Type(() => RelationshipConfDto)
  @ValidateNested()
  conf: RelationshipConfDto;
}

export class SubmitJobDto {
  @IsNumberString()
  version: string;

  @Type(() => RequestContextDto)
  @ValidateNested()
  requestContext: RequestContextDto;

  @IsString()
  name: string;

  @Type(() => RecipientDto)
  @ValidateNested()
  recipient: RecipientDto;

  @Type(() => ItemDto)
  @ValidateNested()
  item: ItemDto;

  @Type(() => StorageDto)
  @ValidateNested()
  storage: StorageDto;

  @Type(() => RelationshipDto)
  @IsArray()
  @ValidateNested()
  relationships: RelationshipDto[];
}
