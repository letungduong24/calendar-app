import { Controller, Post, Get, Delete, Query, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createGroq } from '@ai-sdk/groq';
import { streamText, convertToModelMessages, type UIMessage, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { AppointmentsService } from '../appointments/appointments.service';
import { PeopleService } from '../people/people.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatMessage } from './chat-message.entity';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

@Controller('api/chat')
export class ChatbotController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly peopleService: PeopleService,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getHistory(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const userId = req.user.userId;
    const [messages, total] = await this.chatMessageRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      messages: messages.reverse(),
      total,
      page,
      limit,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('history')
  @HttpCode(204)
  async clearHistory(@Req() req: any) {
    const userId = req.user.userId;
    await this.chatMessageRepository.delete({ userId });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async handleChat(@Req() req: any, @Res() res: Response) {
    const { messages }: { messages: UIMessage[] } = req.body;
    const userId = req.user.userId;

    // Save the latest user message
    const lastMessage = messages[messages.length - 1];
    // DB saving logic removed

    const today = new Date().toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).split('/').reverse().join('-'); // YYYY-MM-DD

    // Sanitize history messages: strip tool parts from older messages to prevent
    // malformed tool_calls (missing 'arguments') error from Groq API.
    // Only the last 2 messages (latest exchange) keep full parts.
    const sanitizeMessages = (msgs: UIMessage[]): UIMessage[] => {
      return msgs.map((msg, idx) => {
        const isRecent = idx >= msgs.length - 2;
        if (!msg.parts) return msg;
        
        const sanitizedParts = (msg.parts as any[]).map(part => {
          if (part.type === 'text') return part;
          if (isRecent && part.type.startsWith('tool-')) {
            return { ...part, args: part.args || {} };
          }
          return null;
        }).filter(Boolean);

        return { ...msg, parts: sanitizedParts } as UIMessage;
      });
    };

    const sanitized = sanitizeMessages(messages);
    const modelMessages = await convertToModelMessages(sanitized);

    const now = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayOfWeek = days[now.getDay()];

    // Tính toán mốc thời gian chuẩn
    const currentDay = now.getDay(); 
    const daysToSunday = currentDay === 0 ? 0 : 7 - currentDay;
    const sundayThisWeek = new Date(now.getTime() + daysToSunday * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const mondayNextWeek = new Date(now.getTime() + (daysToSunday + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const sundayNextWeek = new Date(now.getTime() + (daysToSunday + 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:mm

    const result = streamText({
      model: groq('openai/gpt-oss-120b'),
      system: `Bạn là trợ lý ảo thân thiện của ứng dụng Lịch (Calendar App).
Hôm nay là: ${dayOfWeek}, ngày ${today}, bây giờ là ${currentTime}.
Người dùng hiện tại ID: ${userId}.

Nhiệm vụ của bạn:
- Giúp người dùng quản lý lịch hẹn (xem, tạo, xóa).
- Bạn có thể tra cứu danh bạ để mời người khác vào lịch hẹn.
- Trả lời súc tích, tự nhiên bằng tiếng Việt.
- TUYỆT ĐỐI KHÔNG DÙNG MARKDOWN. KHÔNG dùng dấu sao (*), dấu thăng (#), hay dấu gạch ngang (-) để liệt kê. Chỉ dùng văn bản thuần túy và xuống dòng.
- GIỜ: Luôn sử dụng định dạng 24h (HH:mm). Ví dụ: 2 giờ chiều là 14:00. TUYỆT ĐỐI không dùng định dạng 12h (am/pm).
- THỜI GIAN HIỆN TẠI: ${dayOfWeek}, ngày ${today}, giờ hiện tại là ${currentTime}. Dùng mốc này để tính toán các yêu cầu tương đối như "30 phút nữa", "chiều nay", "tối mai".
- ĐỊNH NGHĨA TUẦN:
  + TUẦN NÀY: Từ hôm nay ${today} đến hết Chủ Nhật ${sundayThisWeek}.
  + TUẦN TỚI: Từ Thứ Hai ${mondayNextWeek} đến hết Chủ Nhật ${sundayNextWeek}.
- QUY TRÌNH TẠO LỊCH: Mặc định mỗi lịch hẹn dài 1 tiếng (endTime = startTime + 1h). QUAN TRỌNG: Nếu người dùng không nhắc đến thời gian nhắc hẹn, mặc định đặt nhắc trước 12 tiếng (720).
- QUY TRÌNH HỦY LỊCH: Luôn gọi getAppointments tìm ID trước khi xóa. Nếu người dùng yêu cầu "hủy hết" hoặc xóa nhiều lịch, bạn PHẢI sử dụng tool deleteMultipleAppointments để xóa tất cả ID trong 1 lần gọi duy nhất.
- Xử lý thay thế (Replace): Thực hiện 2 bước trong 1 lần (xóa cũ, tạo mới) nếu có đủ thông tin.
- Xử lý trùng lịch: Nếu tool createAppointment báo lỗi CONFLICT, hãy thông báo tên và giờ của lịch bị trùng cho người dùng. Hỏi người dùng xem họ muốn "Xóa lịch cũ để tạo lịch mới" hay "Giữ nguyên lịch cũ".
- Xử lý người tham gia: Luôn gọi resolveAttendees trước khi tạo lịch nếu người dùng nhắc đến tên người. Sau khi có attendeeIds, bạn PHẢI gọi createAppointment ngay trong cùng một lượt phản hồi. KHÔNG ĐƯỢC dừng lại chỉ để hiện danh sách người tham gia.
- GIAO TIẾP: KHÔNG ĐƯỢC yêu cầu người dùng nhập đúng định dạng kỹ thuật (như YYYY-MM-DD hay HH:mm). Hãy để người dùng nói tự nhiên (ví dụ: "mai", "chiều nay", "5h"), bạn sẽ tự quy đổi sang định dạng chuẩn để gọi tool.

Hướng dẫn dùng tool getAppointments:
- startDate, endDate: định dạng YYYY-MM-DD.
- attendeeNames: mảng tên người tham gia (nếu cần lọc).
- minTime, maxTime: định dạng HH:mm (ví dụ: Chiều là minTime="12:00").

Các tools khác:
- Tạo lịch: createAppointment (cần title, date YYYY-MM-DD, time HH:mm). Giá trị reminder (phút): 0 = không nhắc, 5 = 5 phút, 10 = 10 phút, 30 = 30 phút, 60 = 1 giờ, 720 = 12 tiếng, 1440 = 1 ngày, 10080 = 1 tuần. Mặc định nếu người dùng không đề cập: reminder=720 (12 tiếng).
- Cập nhật lịch: updateAppointment (truyền ID và các trường cần sửa).
- "Tạo lịch với [tên]" hoặc "Tạo lịch với [tên A] và [tên B]": gọi resolveAttendees trước với tất cả các tên trong 1 lần.
- resolveAttendees trả về attendeeIds để dùng trong createAppointment. Nếu có người được tạo mới, thông báo và hỏi thêm thông tin lịch hẹn.
- Sau khi có attendeeIds, gọi createAppointment ngay.`, 
      messages: modelMessages,
      stopWhen: [
        stepCountIs(5),
        ({ steps }) => {
          // Dừng ngay sau khi các tool này được gọi để tránh AI nhắn thêm văn bản thừa thãi gây lag
          const TERMINAL_TOOLS = [
            'getAppointments', 
            'getContacts',
            'createAppointment',
            'updateAppointment',
            'deleteAppointment',
            'deleteMultipleAppointments',
          ];
          return steps.at(-1)?.toolCalls?.some(tc => TERMINAL_TOOLS.includes(tc.toolName)) ?? false;
        },
      ],
      tools: {
        getAppointments: tool({
          description: 'Get user appointments within a date range (inclusive). Can filter by one or more attendee names.',
          inputSchema: z.object({
            startDate: z.string().describe('Start date in YYYY-MM-DD format'),
            endDate: z.string().describe('End date in YYYY-MM-DD format'),
            attendeeNames: z.array(z.string()).optional().describe('List of attendee names to filter by (all must be present)'),
            minTime: z.string().optional().describe('Filter by start time >= this value (HH:mm)'),
            maxTime: z.string().optional().describe('Filter by start time <= this value (HH:mm)'),
          }),
          execute: async ({ startDate, endDate, attendeeNames, minTime, maxTime }) => {
            // Ensure proper range order
            let start = startDate;
            let end = endDate;
            if (new Date(start) > new Date(end)) {
              [start, end] = [end, start];
            }

            const appointments = await this.appointmentsService.findByRange(
              { userId },
              start,
              end,
              attendeeNames,
              minTime,
              maxTime,
            );
            return appointments.map(a => ({
              id: a.id,
              title: a.title,
              date: a.date,
              time: a.time,
              endTime: a.endTime,
              description: a.description,
              location: a.location,
              reminder: a.reminder,
              attendees: a.attendees?.map((p: any) => ({ id: p.id, name: p.name })) ?? [],
            }));
          },
        }),

        createAppointment: tool({
          description: 'Create a new appointment.',
          inputSchema: z.object({
            title: z.string().describe('Appointment title'),
            date: z.string().describe('Appointment date in YYYY-MM-DD format'),
            time: z.string().describe('Start time in HH:mm format'),
            endTime: z.string().optional().describe('End time in HH:mm format (optional)'),
            reminder: z.number().optional().describe('Minutes before the event to send a reminder. Default is 720 (12 hours).'),
            description: z.string().optional().describe('Detailed description (optional)'),
            location: z.string().optional().describe('Location (optional)'),
            attendeeIds: z.array(z.number()).optional().describe('Array of attendee person IDs (optional)'),
          }),
          execute: async (data) => {
            try {
              // Ensure default reminder of 12h (720 mins) if not provided
              const finalData = {
                ...data,
                reminder: data.reminder ?? 720
              };
              const appointment = await this.appointmentsService.create({ userId }, finalData as any);
              return { success: true, appointment };
            } catch (error: any) {
              // Nếu trùng lịch, backend trả về lỗi 409 kèm thông tin lịch trùng
              return { 
                success: false, 
                errorType: 'CONFLICT',
                message: error.response?.message || error.message,
                conflictingAppointment: error.response?.conflictingAppointment
              };
            }
          },
        }),

        deleteAppointment: tool({
          description: 'Delete an appointment by ID.',
          inputSchema: z.object({
            id: z.number().describe('Appointment ID to delete'),
          }),
          execute: async ({ id }) => {
            const appointment = await this.appointmentsService.remove({ userId }, id);
            return { 
              success: !!appointment, 
              title: appointment?.title,
              message: appointment ? `Đã xóa lịch: ${appointment.title}` : 'Không tìm thấy lịch hẹn để xóa'
            };
          },
        }),

        deleteMultipleAppointments: tool({
          description: 'Delete multiple appointments at once by their IDs.',
          inputSchema: z.object({
            ids: z.array(z.number()).describe('Array of appointment IDs to delete'),
          }),
          execute: async ({ ids }) => {
            const count = await this.appointmentsService.removeBatch({ userId }, ids);
            return { 
              success: count > 0, 
              count,
              message: `Đã xóa thành công ${count} lịch hẹn`
            };
          },
        }),

        resolveAttendees: tool({
          description: 'Find or auto-create contacts by name. Use this before createAppointment when the user mentions specific people. Accepts multiple names at once.',
          inputSchema: z.object({
            names: z.array(z.string()).describe('Array of person names to find or create (e.g. ["Duong", "Tien"])'),
          }),
          execute: async ({ names }) => {
            const allContacts = await this.peopleService.findAll({ userId });
            const resolved: { id: number; name: string }[] = [];
            const created: string[] = [];

            for (const rawName of names) {
              const normalized = rawName.trim().toLowerCase();
              
              // 1. Tìm chính xác tuyệt đối
              let found = allContacts.find(c => c.name.trim().toLowerCase() === normalized);
              
              // 2. Nếu không thấy, tìm theo bắt đầu bằng (Prefix)
              if (!found) {
                found = allContacts.find(c => c.name.trim().toLowerCase().startsWith(normalized));
              }
              
              // 3. Nếu vẫn không thấy, mới tìm theo chứa (Includes)
              if (!found) {
                found = allContacts.find(c => c.name.trim().toLowerCase().includes(normalized));
              }

              if (found) {
                resolved.push({ id: found.id, name: found.name });
              } else {
                // Auto-create the person
                const newPerson = await this.peopleService.create(
                  { userId },
                  { name: rawName.trim() } as any,
                );
                resolved.push({ id: newPerson.id, name: newPerson.name });
                created.push(newPerson.name);
              }
            }

            return {
              attendeeIds: resolved.map(r => r.id),
              attendees: resolved,
              newlyCreated: created, // names of auto-created contacts
            };
          },
        }),
      },
      onFinish: async ({ text, toolCalls, toolResults }) => {
        const invocations = (toolCalls || []).map(tc => {
          const result = (toolResults as any[] || []).find(tr => tr.toolCallId === tc.toolCallId);
          return {
            ...tc,
            state: 'result',
            result: result?.result,
          };
        });

        await this.chatMessageRepository.save({
          userId,
          role: 'assistant',
          content: text,
          toolInvocations: invocations,
        });
      },
    });

    const response = result.toUIMessageStreamResponse();
    
    // Set headers for streaming
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (response.body) {
      const reader = response.body.getReader();
      const read = async () => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        read();
      };
      read();
    } else {
      res.end();
    }
  }
}
