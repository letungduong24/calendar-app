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

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: `Bạn là trợ lý ảo thân thiện của ứng dụng Lịch (Calendar App).
Ngày hôm nay: ${today}.
Người dùng hiện tại ID: ${userId}.

Nhiệm vụ của bạn:
- Giúp người dùng quản lý lịch hẹn (xem, tạo, xóa).
- Bạn có thể tra cứu danh bạ để mời người khác vào lịch hẹn.
- Trả lời súc tích, lịch sự bằng tiếng Việt.
- KHÔNG dùng markdown phức tạp như (**, *, #), chỉ dùng văn bản thuần túy.

Hướng dẫn dùng tool getAppointments:
- startDate: ngày bắt đầu (YYYY-MM-DD). Hôm nay là "${today}".
- daysAhead: số ngày cần mở rộng kể từ startDate. Chỉ cần điền số nguyên, KHÔNG cần tính ngày.
  Ví dụ: "hôm nay" → daysAhead=0, "ngày mai" → daysAhead=1, "3 ngày tới" → daysAhead=3,
  "1 tuần tới" → daysAhead=7, "1 tháng tới" → daysAhead=30, "2 tháng tới" → daysAhead=60, "1 năm tới" → daysAhead=365.
- attendeeName: tên người tham gia (chỉ khi có yêu cầu lọc theo người).
- Ngày cụ thể "30/4/2026": startDate="2026-04-30", daysAhead=0.

Các tools khác:
- Tạo lịch: createAppointment (cần title, date YYYY-MM-DD, time HH:mm).
Hướng dẫn tạo lịch với người khác:
- "Tạo lịch với [tên]" hoặc "Tạo lịch với [tên A] và [tên B]": gọi resolveAttendees trước với tất cả các tên trong 1 lần.
- resolveAttendees trả về attendeeIds để dùng trong createAppointment. Nếu có người được tạo mới, thông báo và hỏi thêm thông tin lịch hẹn.
- Sau khi có attendeeIds, gọi createAppointment ngay.`, 
      messages: modelMessages,
      stopWhen: [
        stepCountIs(5),
        ({ steps }) => {
          const TERMINAL_TOOLS = ['getAppointments', 'createAppointment', 'deleteAppointment'];
          return steps.at(-1)?.toolCalls?.some(tc => TERMINAL_TOOLS.includes(tc.toolName)) ?? false;
        },
      ],
      tools: {
        getAppointments: tool({
          description: 'Get user appointments. Provide startDate and daysAhead (integer). Backend computes endDate.',
          inputSchema: z.object({
            startDate: z.string().describe('Start date in YYYY-MM-DD format (today if not specified)'),
            daysAhead: z.number().int().min(0).describe('Number of days to look ahead from startDate. 0=single day, 7=one week, 30=one month, 365=one year'),
            attendeeName: z.string().optional().describe('Filter by attendee name (optional, partial match, case-insensitive)'),
          }),
          execute: async ({ startDate, daysAhead, attendeeName }) => {
            // Backend computes endDate to avoid LLM date arithmetic errors
            const start = new Date(startDate);
            const end = new Date(start);
            end.setDate(end.getDate() + daysAhead);
            const endDate = end.toISOString().split('T')[0];

            const appointments = await this.appointmentsService.findByRange(
              { userId },
              startDate,
              endDate,
              attendeeName,
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
            description: z.string().optional().describe('Detailed description (optional)'),
            location: z.string().optional().describe('Location (optional)'),
            attendeeIds: z.array(z.number()).optional().describe('Array of attendee person IDs (optional)'),
          }),
          execute: async (data) => {
            try {
              const appointment = await this.appointmentsService.create({ userId }, data as any);
              return { success: true, appointment };
            } catch (error: any) {
              return { success: false, message: error.message };
            }
          },
        }),

        deleteAppointment: tool({
          description: 'Delete an appointment by ID.',
          inputSchema: z.object({
            id: z.number().describe('Appointment ID to delete'),
          }),
          execute: async ({ id }) => {
            await this.appointmentsService.remove({ userId }, id);
            return { success: true };
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
              const found = allContacts.find(c =>
                c.name.trim().toLowerCase().includes(normalized),
              );
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
