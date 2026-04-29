import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, IsISO8601, Matches } from 'class-validator';

export class CreateAppointmentDto {
  @IsString({ message: 'Tiêu đề phải là một chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  title: string;

  @IsISO8601({}, { message: 'Ngày không đúng định dạng (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'Ngày không được để trống' })
  date: string;

  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Giờ bắt đầu không đúng định dạng (HH:mm)' })
  @IsNotEmpty({ message: 'Giờ bắt đầu không được để trống' })
  time: string;

  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Giờ kết thúc không đúng định dạng (HH:mm)' })
  @IsOptional()
  endTime?: string;

  @IsString({ message: 'Mô tả phải là một chuỗi ký tự' })
  @IsOptional()
  description?: string;

  @IsNumber({}, { message: 'Thời gian nhắc nhở phải là một con số' })
  @IsOptional()
  reminder?: number;

  @IsArray({ message: 'Danh sách người tham gia phải là một mảng' })
  @IsNumber({}, { each: true, message: 'ID người tham gia phải là một con số' })
  @IsOptional()
  attendeeIds?: number[];
}
