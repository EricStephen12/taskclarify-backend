
export class CanvaIntegration {
  static async createDesign(accessToken: string, title: string, templateId?: string) {
    const body = {
      title: title || "New TaskClarify Design",
      design_type: {
        type: "preset",
        name: templateId || "doc"
      },
    };

    console.log('[Canva Integration] Creating design with body:', JSON.stringify(body));

    const response = await fetch("https://api.canva.com/rest/v1/designs", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const rawResponse = await response.text();
    console.log('[Canva API] Raw Response:', rawResponse);

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch (e) {
      throw new Error(`Canva returned non-JSON response: ${rawResponse.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.message || `Canva API error: ${response.status} - ${rawResponse}`);
    }

    return {
      success: true,
      url: data.url,
      id: data.id,
    };
  }
}
