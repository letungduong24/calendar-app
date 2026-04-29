import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePersonDto {
  @IsString({ message: 'Tên phải là một chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên không được để trống' })
  name: string;

  @IsString({ message: 'Số điện thoại phải là một chuỗi ký tự' })
  @IsOptional()
  phone?: string;
}
