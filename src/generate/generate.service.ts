import Anthropic from '@anthropic-ai/sdk';
import { ContentResponse } from '../../generated/api/models/content-response';
import { Generate } from '../../generated/api/models/generate';
import { BadRequestException, Injectable } from '@nestjs/common';
import { GenerationsService } from 'src/supabase/generations.service';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class GenerateService {
  private anthropic: Anthropic;

  constructor(private db: GenerationsService) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async sendMessage(data: Generate, userId: string) {
    const contentBlocks: Anthropic.MessageParam['content'] = [];

    contentBlocks.push({
      type: 'text',
      text: this.buildMainPrompt(data),
    });

    if (data.image_url) {
      const { base64Data } = this.parseBase64Image(data.image_url);

      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: base64Data,
        },
      });
    }

    const userRequest = await this.db.saveUserRequest(data, userId);

    /* const message = await this.anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      thinking: {
        type: 'adaptive',
      },
      system: this.buildSystemPrompt(data),
      messages: [
        {
          role: 'user',
          content: contentBlocks,
        },
      ],
    });


    // Find all text blocks (thinking blocks come first, so we want the last text block)
    const textBlocks = message.content.filter(
      (block) => block.type === 'text',
    ) as { type: 'text'; text: string }[];

    if (textBlocks.length === 0) {
      throw new BadRequestException('No text response received from API');
    }

    // Get the last text block which should contain the JSON response
    const textBlock = textBlocks[textBlocks.length - 1];

    // Validate that we have actual content
    if (!textBlock.text || textBlock.text.trim().length === 0) {
      throw new BadRequestException(
        'Received empty response from API. Full response: ' +
          JSON.stringify(message.content),
      );
    } */

      const text = {description: "otototo", shortCaption: "lorem ipsum dolores"}




    //const jsonResponse = this.extractJSON(textBlock.text);
    /* await this.db.saveUserGeneration(
      jsonResponse,
      userRequest.data?.id!,
      userId,
    ); */

    return text;
  }

  private parseBase64Image(dataUri: string) {
    const matches = dataUri.match(/^data:(.+);base64,(.+)$/);

    if (!matches) {
      throw new BadRequestException('Invalid image format');
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(matches[1])) {
      throw new BadRequestException('Unsupported image type');
    }

    return { mediaType: matches[1], base64Data: matches[2] };
  }

  private buildSystemPrompt(data: Generate) {
    return `You are a professional photographer who creates concise, impactful social media content.
    
    Your style:
    - ${data.style}
    - Brief and meaningful - every word counts
    - ${data.platform}
    - Sells through feeling and value, not descriptions
    - Natural voice, never marketing jargon
    
    You adapt to any subject - portraits, products, landscapes, events, abstract, anything. You communicate impact in few words.`;
  }

  private buildMainPrompt(data: Generate) {
    return `Create authentic, CONCISE social media content for this image.
    
    USER'S CONTEXT: "${data.prompt}"
    This tells you the purpose. Honor it throughout.
    
    CRITICAL RULES:
    
    1. BE BRIEF
       - Short caption: 1-2 lines MAX
       - Description: 2-3 sentences for sales, 3-4 for stories
       - Every sentence must earn its place
    
    2. NO LITERAL DESCRIPTIONS in captions
       Focus on feeling, impact, or value - not what objects are in the frame
    
    3. ADAPT TO ANY SUBJECT
       - Portraits: The person, the moment, the connection
       - Products: The value, the experience of owning it
       - Events: The energy, the story
       - Landscapes/Travel: The feeling of being there
       - Abstract: The mood, what it evokes
       - Food: The experience, the craving
       Whatever the subject - focus on WHY IT MATTERS, not what it is
    
    4. When selling: Value over description
       - How it feels/works/looks in context
       - Why someone wants this
       - How to get it
    
    5. NO technical jargon
    
    6. VARY your approach each time - different angles, different words
    
    Return JSON:
    {
      "shortCaption": "brief caption",
      "description": "longer caption with line breaks",
      "altText": "accessibility description",
      "hashtags": ["#tag1", "#tag2", "#tag3"]
    }
    
    Context:
    - Style: ${data.style}
    - Platform: ${data.platform}
    - Purpose: ${data.prompt}
    
    Generate:
    
    1. Short caption (1-2 lines): Punchy, purpose-driven
       Match the image type and user's goal
    
    2. Description:
       
       FOR SELLING (2-3 sentences):
       - Hook: Why this matters/stands out
       - Value: What it brings/does
       - Action: How to get it + details
       
       FOR OTHER CONTEXTS (3-4 sentences):
       - Lead with the core feeling/moment/story
       - One key element that connects
       - Close aligned with purpose
       
       Line breaks for readability. Stay tight.
    
    3. Alt text: Clear description of what's actually in the image - this is for accessibility, be specific about subject, setting, colors, key elements.
    
    4. Hashtags: 10 relevant tags
       - Match the subject matter (people, product, place, etc.)
       - Match the platform culture
       - Match the user's purpose (selling, storytelling, etc.)
       - Mix popular and niche
    
    Keep it concise. Make every word count. Adapt to whatever image you receive.
    
    Return only valid JSON with keys: shortCaption, description, altText, hashtags`;
  }

  private extractJSON(text: string): ContentResponse {
    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    if (!cleaned) {
      throw new BadRequestException(
        'No JSON content found in response. Raw text: ' + text,
      );
    }

    try {
      return JSON.parse(cleaned);
    } catch (error) {
      throw new BadRequestException(
        `Failed to parse JSON response. Error: ${error.message}. Raw text: ${text}. Cleaned text: ${cleaned}`,
      );
    }
  }
}
