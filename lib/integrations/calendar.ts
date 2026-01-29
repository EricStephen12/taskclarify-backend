import { google } from "googleapis";

export class CalendarIntegration {
  static async createEvent(accessToken: string, params: { title: string, start_time: string, duration_mins: number, description?: string, location?: string }) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: "v3", auth });

    const { title, start_time, duration_mins, description, location } = params;
    
    const start = new Date(start_time);
    const end = new Date(start.getTime() + (duration_mins || 30) * 60000);

    const res = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: title,
        description,
        location,
        start: {
          dateTime: start.toISOString(),
        },
        end: {
          dateTime: end.toISOString(),
        },
      },
    });

    return {
      success: true,
      id: res.data.id,
      html_link: res.data.htmlLink,
    };
  }
}
