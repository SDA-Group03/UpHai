import { Database } from "bun:sqlite";

export const db = new Database("voke.sqlite", { create: true });

export function initDB() {
  console.log("📂 Initializing Database...");

  // Drop tables for a clean slate in development.
  db.run(`DROP TABLE IF EXISTS instances;`);
  db.run(`DROP TABLE IF EXISTS models;`);
  db.run(`DROP TABLE IF EXISTS engines;`);

  db.run(`
    CREATE TABLE IF NOT EXISTS engines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      docker_image TEXT NOT NULL,
      health_endpoint TEXT NOT NULL,
      status TEXT DEFAULT 'available',
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY,
      engine TEXT NOT NULL,
      name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      category TEXT NOT NULL,
      series TEXT,
      performance_tier TEXT,
      size_mb INTEGER,
      icon_url TEXT,
      description TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS instances (
      id TEXT PRIMARY KEY,
      engine_id TEXT NOT NULL,
      model_id TEXT NOT NULL,
      container_name TEXT NOT NULL,
      port INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      last_activity INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (engine_id) REFERENCES engines(id),
      FOREIGN KEY (model_id) REFERENCES models(id)
    );
  `);

  seedDB();
  console.log("✅ Database ready!");
}

export function seedDB() {
  try {
    const engines = [
      { id: 'ollama', name: 'Ollama', type: 'llm', docker_image: 'ollama/ollama', health_endpoint: '/api/tags' },
      { id: 'whisper', name: 'Whisper', type: 'speech', docker_image: 'voke/whisper:latest', health_endpoint: '/health' },
      { id: 'stable-diffusion', name: 'Stable Diffusion', type: 'image', docker_image: 'voke/stable-diffusion:latest', health_endpoint: '/ping' }
    ];

    const models = [
      // ============= CHAT MODELS - NANO/TURBO (< 3B) =============
      {
        id: 'ollama-qwen2-0.5b',
        engine: 'ollama',
        name: 'qwen2:0.5b',
        display_name: 'Qwen 2 (0.5B)',
        category: 'Chat',
        series: 'Qwen',
        performance_tier: 'Turbo / Nano (< 3B)',
        size_mb: 352,
        description: 'An ultra-lightweight and blazingly fast language model from Alibaba Cloud. Despite its compact 0.5B parameter size, it delivers impressive performance for basic conversational tasks, simple question answering, and text completion. Perfect for resource-constrained environments and edge devices where speed is critical. Supports multiple languages with decent accuracy and maintains low latency responses.',
        icon_url: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/Tongyi.png'
      },
      {
        id: 'ollama-qwen2-1.5b',
        engine: 'ollama',
        name: 'qwen2:1.5b',
        display_name: 'Qwen 2 (1.5B)',
        category: 'Chat',
        series: 'Qwen',
        performance_tier: 'Turbo / Nano (< 3B)',
        size_mb: 934,
        description: 'A highly efficient small-scale language model that strikes an excellent balance between size and capability. With 1.5B parameters, it offers significantly better reasoning and understanding compared to the 0.5B variant while maintaining fast inference speeds. Excels at general conversations, basic coding assistance, summarization, and multilingual tasks. Ideal for applications requiring quick responses without sacrificing too much quality.',
        icon_url: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/Tongyi.png'
      },
      {
        id: 'ollama-gemma-2b',
        engine: 'ollama',
        name: 'gemma:2b',
        display_name: 'Gemma (2B)',
        category: 'Chat',
        series: 'Gemma',
        performance_tier: 'Turbo / Nano (< 3B)',
        size_mb: 1400,
        description: 'Google\'s compact yet powerful open-source language model built on the same research and technology as Gemini. Despite its 2B parameter count, Gemma demonstrates remarkable capabilities in understanding context, following instructions, and generating coherent responses. Trained on a diverse dataset with strong safety filters, it excels at creative writing, educational content, and general assistance tasks while maintaining responsible AI practices.',
        icon_url: 'https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png'
      },
      {
        id: 'ollama-tinyllama-1.1b',
        engine: 'ollama',
        name: 'tinyllama:1.1b',
        display_name: 'TinyLlama (1.1B)',
        category: 'Chat',
        series: 'Llama',
        performance_tier: 'Turbo / Nano (< 3B)',
        size_mb: 637,
        description: 'An extremely compact version of the Llama architecture, specifically designed for deployment on devices with limited computational resources. This 1.1B parameter model delivers surprisingly good performance for its size, making it perfect for mobile applications, IoT devices, and embedded systems. Handles basic conversations, simple question answering, and text generation tasks with minimal memory footprint and exceptional speed.',
        icon_url: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/Meta.svg'
      },
      {
        id: 'ollama-phi-2.7b',
        engine: 'ollama',
        name: 'phi:2.7b',
        display_name: 'Phi 2 (2.7B)',
        category: 'Chat',
        series: 'Phi',
        performance_tier: 'Turbo / Nano (< 3B)',
        size_mb: 1600,
        description: 'Microsoft\'s innovative small language model that punches well above its weight class. Phi-2 demonstrates exceptional reasoning capabilities, strong performance on coding tasks, and impressive common sense understanding despite its compact 2.7B parameter size. Trained on high-quality textbook-like data, it excels at logical reasoning, mathematical problems, and code generation, often matching or exceeding the performance of much larger models on specific tasks.',
        icon_url: 'https://raw.githubusercontent.com/microsoft/Phi-3/main/assets/phi-logo-square-blue-white.png'
      },

      // ============= CHAT MODELS - BALANCED (3B - 7B) =============
      {
        id: 'ollama-llama3.2-3b',
        engine: 'ollama',
        name: 'llama3.2:3b',
        display_name: 'Llama 3.2 (3B)',
        category: 'Chat',
        series: 'Llama',
        performance_tier: 'Balanced (3B - 7B)',
        size_mb: 2000,
        description: 'Meta\'s latest iteration in the Llama 3 series, optimized for efficient on-device deployment. This 3B parameter model offers an excellent balance between quality and speed, featuring improved instruction following, better contextual understanding, and enhanced multilingual capabilities. Ideal for applications requiring reliable performance across diverse tasks including summarization, creative writing, question answering, and basic reasoning without the computational overhead of larger models.',
        icon_url: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/Meta.svg'
      },
      {
        id: 'ollama-phi3-3.8b',
        engine: 'ollama',
        name: 'phi3:3.8b',
        display_name: 'Phi-3 (3.8B)',
        category: 'Chat',
        series: 'Phi',
        performance_tier: 'Balanced (3B - 7B)',
        size_mb: 2300,
        description: 'The third generation of Microsoft\'s Phi series, representing a significant leap in small model capabilities. With 3.8B parameters, Phi-3 delivers outstanding performance on reasoning, coding, and instruction-following tasks. Trained using a refined dataset focusing on high-quality educational content, it demonstrates remarkable proficiency in STEM subjects, programming challenges, and complex problem-solving while maintaining efficient resource usage perfect for edge deployment.',
        icon_url: 'https://raw.githubusercontent.com/microsoft/Phi-3/main/assets/phi-logo-square-blue-white.png'
      },
      {
        id: 'ollama-gemma-7b',
        engine: 'ollama',
        name: 'gemma:7b',
        display_name: 'Gemma (7B)',
        category: 'Chat',
        series: 'Gemma',
        performance_tier: 'Balanced (3B - 7B)',
        size_mb: 4800,
        description: 'Google\'s flagship 7B parameter open model, representing the sweet spot between performance and efficiency. Built on Gemini research breakthroughs, Gemma 7B excels across a wide range of tasks including creative content generation, detailed question answering, document summarization, and code assistance. Features robust safety measures, strong instruction adherence, and excellent performance on academic benchmarks while remaining accessible for local deployment.',
        icon_url: 'https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png'
      },
      {
        id: 'ollama-mistral-7b',
        engine: 'ollama',
        name: 'mistral:7b',
        display_name: 'Mistral (7B)',
        category: 'Chat',
        series: 'Mistral',
        performance_tier: 'Balanced (3B - 7B)',
        size_mb: 4100,
        description: 'A groundbreaking 7B parameter model from Mistral AI that sets new standards for efficiency and performance in its class. Utilizing advanced architectural innovations including grouped-query attention and sliding window attention, Mistral delivers exceptional results across reasoning, coding, and general knowledge tasks. Known for its strong multilingual capabilities, precise instruction following, and ability to handle extended context while maintaining consistent quality throughout.',
        icon_url: 'https://mistral.ai/images/logo_hubc88c4ece131b91c7cb753f40e9e1cc5_2589_256x0_resize_q97_h2_lanczos_3.webp'
      },
      {
        id: 'ollama-qwen2-7b',
        engine: 'ollama',
        name: 'qwen2:7b',
        display_name: 'Qwen 2 (7B)',
        category: 'Chat',
        series: 'Qwen',
        performance_tier: 'Balanced (3B - 7B)',
        size_mb: 4400,
        description: 'Alibaba Cloud\'s comprehensive 7B parameter model offering versatile capabilities across multiple domains. Qwen 2 7B demonstrates strong performance in both Chinese and English, excelling at long-form content generation, complex reasoning tasks, and cross-lingual understanding. Features enhanced context handling, improved factual accuracy, and robust performance on technical subjects including mathematics and programming, making it suitable for diverse production applications.',
        icon_url: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/Tongyi.png'
      },
      {
        id: 'ollama-llama3.1-8b',
        engine: 'ollama',
        name: 'llama3.1:8b',
        display_name: 'Llama 3.1 (8B)',
        category: 'Chat',
        series: 'Llama',
        performance_tier: 'Balanced (3B - 7B)',
        size_mb: 4700,
        description: 'Meta\'s enhanced 8B parameter model featuring significant improvements in instruction following, reasoning capabilities, and extended context length support. Llama 3.1 introduces better handling of complex multi-turn conversations, improved tool use capabilities, and enhanced performance on coding and mathematical reasoning tasks. Supports up to 128k context length, enabling sophisticated applications like document analysis, long-form content creation, and advanced conversational AI systems.',
        icon_url: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/Meta.svg'
      },

      // ============= CHAT MODELS - HIGH PRECISION (> 8B) =============
      {
        id: 'ollama-llama3.3-70b',
        engine: 'ollama',
        name: 'llama3.3:70b',
        display_name: 'Llama 3.3 (70B)',
        category: 'Chat',
        series: 'Llama',
        performance_tier: 'High Precision (> 8B)',
        size_mb: 43000,
        description: 'Meta\'s most advanced open-source language model, featuring 70 billion parameters optimized for maximum performance across all task categories. Llama 3.3 represents the pinnacle of open LLM technology, delivering state-of-the-art results in complex reasoning, advanced coding, mathematical problem-solving, and nuanced creative writing. Excels at handling sophisticated multi-step tasks, maintaining coherence across very long contexts, and providing expert-level assistance across diverse domains. Ideal for production applications requiring the highest quality outputs.',
        icon_url: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/Meta.svg'
      },
      {
        id: 'ollama-mixtral-8x7b',
        engine: 'ollama',
        name: 'mixtral:8x7b',
        display_name: 'Mixtral 8x7B',
        category: 'Chat',
        series: 'Mistral',
        performance_tier: 'High Precision (> 8B)',
        size_mb: 26000,
        description: 'Revolutionary Mixture-of-Experts (MoE) architecture from Mistral AI that achieves 70B-level performance while only activating 13B parameters per token. This innovative design enables exceptional efficiency, matching or exceeding larger dense models on most benchmarks while requiring significantly less compute. Demonstrates outstanding multilingual capabilities across dozens of languages, superior coding abilities, and impressive reasoning skills. Perfect for applications demanding high-quality outputs with optimized resource usage.',
        icon_url: 'https://mistral.ai/images/logo_hubc88c4ece131b91c7cb753f40e9e1cc5_2589_256x0_resize_q97_h2_lanczos_3.webp'
      },

      // ============= VISION MODELS - NANO/TURBO =============
      {
        id: 'ollama-moondream',
        engine: 'ollama',
        name: 'moondream',
        display_name: 'Moondream 2',
        category: 'Vision',
        series: 'Moondream',
        performance_tier: 'Turbo / Nano (< 3B)',
        size_mb: 1600,
        description: 'An incredibly compact vision-language model specifically designed for edge deployment and resource-constrained environments. Despite its tiny footprint of just 1.6B parameters, Moondream 2 delivers impressive image understanding capabilities including object detection, scene description, OCR, and visual question answering. Optimized for real-time inference on mobile devices, IoT systems, and embedded platforms where larger vision models would be impractical. Excellent for applications like mobile assistants, smart cameras, and edge AI devices.',
        icon_url: 'https://avatars.githubusercontent.com/u/149426408'
      },

      // ============= VISION MODELS - BALANCED =============
      {
        id: 'ollama-llava-7b',
        engine: 'ollama',
        name: 'llava:7b',
        display_name: 'LLaVA 7B',
        category: 'Vision',
        series: 'LLaVA',
        performance_tier: 'Balanced (3B - 7B)',
        size_mb: 4500,
        description: 'Large Language and Vision Assistant (LLaVA) represents a breakthrough in multimodal AI, combining powerful visual understanding with natural language processing. This 7B parameter model excels at visual reasoning, detailed image description, chart and diagram interpretation, and conversational interaction about visual content. Trained on a diverse dataset of image-text pairs, it can answer complex questions about images, identify objects and scenes, read text in images, and provide contextual explanations making it ideal for educational applications, accessibility tools, and visual content analysis.',
        icon_url: 'https://www.llava-vl.com/images/llava_logo.png'
      },
      {
        id: 'ollama-bakllava-7b',
        engine: 'ollama',
        name: 'bakllava:7b',
        display_name: 'BakLLaVA 7B',
        category: 'Vision',
        series: 'LLaVA',
        performance_tier: 'Balanced (3B - 7B)',
        size_mb: 4500,
        description: 'An enhanced variant of LLaVA trained with carefully curated, high-quality image-text pairs from the "Bakery" dataset. BakLLaVA 7B demonstrates improved accuracy in visual understanding, more detailed and accurate image descriptions, and better performance on complex visual reasoning tasks. Excels at fine-grained object recognition, spatial relationship understanding, and providing comprehensive explanations of visual content. Particularly strong at handling diverse image types including photographs, illustrations, diagrams, and infographics.',
        icon_url: 'https://www.llava-vl.com/images/llava_logo.png'
      },

      // ============= VISION MODELS - HIGH PRECISION =============
      {
        id: 'ollama-llama3.2-vision-11b',
        engine: 'ollama',
        name: 'llama3.2-vision:11b',
        display_name: 'Llama 3.2 Vision (11B)',
        category: 'Vision',
        series: 'Llama',
        performance_tier: 'High Precision (> 8B)',
        size_mb: 7900,
        description: 'Meta\'s cutting-edge multimodal model that seamlessly integrates advanced visual understanding with powerful language capabilities. Llama 3.2 Vision 11B sets new standards for open-source vision-language models, offering exceptional performance in image comprehension, visual question answering, OCR, document understanding, and visual reasoning. Features sophisticated spatial awareness, accurate object detection, and the ability to understand complex visual relationships. Supports high-resolution image analysis and maintains consistency across extended multi-turn conversations about visual content, making it perfect for professional applications in education, healthcare, research, and content creation.',
        icon_url: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/Meta.svg'
      },
      {
        id: 'ollama-llava-13b',
        engine: 'ollama',
        name: 'llava:13b',
        display_name: 'LLaVA 13B',
        category: 'Vision',
        series: 'LLaVA',
        performance_tier: 'High Precision (> 8B)',
        size_mb: 8000,
        description: 'The flagship version of LLaVA offering significantly enhanced visual understanding and reasoning capabilities through its 13B parameter architecture. This larger model provides more nuanced image interpretation, deeper contextual understanding, and more detailed responses to complex visual queries. Excels at academic and professional use cases including scientific image analysis, medical imaging interpretation, architectural design review, and detailed art criticism. Demonstrates superior performance in handling ambiguous visual information and providing comprehensive, well-reasoned explanations.',
        icon_url: 'https://www.llava-vl.com/images/llava_logo.png'
      },

      // ============= CODING MODELS - NANO/TURBO =============
      {
        id: 'ollama-codeqwen-1.5b',
        engine: 'ollama',
        name: 'codeqwen:1.5b',
        display_name: 'CodeQwen (1.5B)',
        category: 'Chat',
        series: 'Qwen',
        performance_tier: 'Turbo / Nano (< 3B)',
        size_mb: 900,
        description: 'A specialized lightweight coding model from Alibaba Cloud designed for fast code completion, simple debugging, and basic programming assistance. Despite its compact 1.5B parameter size, CodeQwen demonstrates impressive understanding of popular programming languages including Python, JavaScript, Java, C++, and more. Excels at code completion, syntax correction, simple refactoring suggestions, and explaining code snippets. Perfect for IDE integration, real-time code suggestions, and educational programming environments where low latency is crucial.',
        icon_url: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/Tongyi.png'
      },

      // ============= CODING MODELS - BALANCED =============
      {
        id: 'ollama-codellama-7b',
        engine: 'ollama',
        name: 'codellama:7b',
        display_name: 'Code Llama (7B)',
        category: 'Chat',
        series: 'Llama',
        performance_tier: 'Balanced (3B - 7B)',
        size_mb: 3800,
        description: 'Meta\'s specialized code generation model built on Llama 2 architecture and fine-tuned extensively on programming data. Code Llama 7B offers robust support for major programming languages with strong capabilities in code generation, completion, debugging, and documentation. Can handle complex programming tasks including algorithm implementation, bug fixing, code optimization, and translating natural language requirements into working code. Supports infilling for IDE integration and demonstrates good understanding of coding patterns, best practices, and common frameworks.',
        icon_url: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/Meta.svg'
      },
      {
        id: 'ollama-deepseek-coder-6.7b',
        engine: 'ollama',
        name: 'deepseek-coder:6.7b',
        display_name: 'DeepSeek Coder (6.7B)',
        category: 'Chat',
        series: 'DeepSeek',
        performance_tier: 'Balanced (3B - 7B)',
        size_mb: 3800,
        description: 'A highly specialized coding model from DeepSeek AI that excels at generating accurate, efficient, and well-structured code across multiple programming paradigms. Trained on a massive corpus of high-quality code repositories and technical documentation, DeepSeek Coder 6.7B demonstrates exceptional performance in complex algorithm implementation, system design, code refactoring, and technical problem-solving. Particularly strong at understanding context, following coding conventions, and producing production-ready code with minimal errors. Supports advanced features like repository-level code completion and cross-file understanding.',
        icon_url: 'https://avatars.githubusercontent.com/u/145223814'
      },

      // ============= CODING MODELS - HIGH PRECISION =============
      {
        id: 'ollama-codellama-13b',
        engine: 'ollama',
        name: 'codellama:13b',
        display_name: 'Code Llama (13B)',
        category: 'Chat',
        series: 'Llama',
        performance_tier: 'High Precision (> 8B)',
        size_mb: 7300,
        description: 'The most capable version of Code Llama, offering advanced code generation and understanding capabilities through its 13B parameter architecture. This model excels at handling complex software engineering tasks including full application development, architectural design, advanced debugging, performance optimization, and comprehensive code review. Demonstrates deep understanding of software design patterns, framework-specific conventions, and best practices across diverse technology stacks. Capable of generating complete, production-ready code modules with proper error handling, documentation, and testing considerations. Ideal for professional development environments requiring high-quality code assistance.',
        icon_url: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/Meta.svg'
      },

      // ============= AUDIO MODELS =============
      {
        id: 'whisper-tiny',
        engine: 'whisper',
        name: 'tiny',
        display_name: 'Whisper Tiny',
        category: 'Audio',
        series: 'Whisper',
        performance_tier: 'Turbo / Nano (< 3B)',
        size_mb: 75,
        description: 'OpenAI\'s most compact speech recognition model, optimized for real-time transcription on resource-constrained devices. Whisper Tiny delivers surprisingly accurate speech-to-text conversion despite its minimal 39M parameter footprint. Perfect for applications requiring immediate transcription with low latency such as live captioning, voice commands, and mobile dictation. Supports multiple languages and handles various audio conditions, though with reduced accuracy compared to larger variants. Ideal for edge deployment where speed and efficiency are paramount.',
        icon_url: 'https://seeklogo.com/images/O/openai-logo-825783CADB-seeklogo.com.png'
      },
      {
        id: 'whisper-base',
        engine: 'whisper',
        name: 'base',
        display_name: 'Whisper Base',
        category: 'Audio',
        series: 'Whisper',
        performance_tier: 'Turbo / Nano (< 3B)',
        size_mb: 145,
        description: 'The foundational Whisper model offering a solid balance between speed and accuracy for general-purpose speech recognition. With 74M parameters, Whisper Base provides reliable transcription across dozens of languages and can handle various accents, audio qualities, and speaking styles. Performs well in reasonably clean audio environments and is suitable for applications like meeting transcription, podcast subtitling, voice memos, and basic accessibility features. Supports automatic language detection and demonstrates robust performance across diverse acoustic conditions.',
        icon_url: 'https://seeklogo.com/images/O/openai-logo-825783CADB-seeklogo.com.png'
      },
      {
        id: 'whisper-small',
        engine: 'whisper',
        name: 'small',
        display_name: 'Whisper Small',
        category: 'Audio',
        series: 'Whisper',
        performance_tier: 'Balanced (3B - 7B)',
        size_mb: 488,
        description: 'A mid-tier Whisper model featuring 244M parameters that significantly improves transcription accuracy while maintaining reasonable processing speeds. Whisper Small excels at handling challenging audio scenarios including background noise, overlapping speech, accented speakers, and poor recording quality. Provides more accurate punctuation, better word-level timestamps, and improved handling of technical terminology and proper nouns. Ideal for professional transcription services, content creation workflows, accessibility applications, and any use case where accuracy is more important than absolute speed.',
        icon_url: 'https://seeklogo.com/images/O/openai-logo-825783CADB-seeklogo.com.png'
      },
      {
        id: 'whisper-medium',
        engine: 'whisper',
        name: 'medium',
        display_name: 'Whisper Medium',
        category: 'Audio',
        series: 'Whisper',
        performance_tier: 'Balanced (3B - 7B)',
        size_mb: 1500,
        description: 'A powerful 769M parameter speech recognition model offering near-state-of-the-art accuracy for most transcription tasks. Whisper Medium demonstrates exceptional performance across a wide range of challenging scenarios including multiple speakers, technical discussions, medical terminology, legal proceedings, and diverse international accents. Features highly accurate punctuation, superior handling of homonyms and context-dependent words, and excellent timestamp precision. Particularly strong at transcribing content in noisy environments, handling code-switching between languages, and maintaining accuracy with domain-specific vocabulary. Recommended for professional applications requiring high-quality transcriptions such as legal documentation, medical records, research interviews, and broadcast media.',
        icon_url: 'https://seeklogo.com/images/O/openai-logo-825783CADB-seeklogo.com.png'
      },

      // ============= IMAGE GENERATION =============
      {
        id: 'sd-xl-turbo',
        engine: 'stable-diffusion',
        name: 'sdxl-turbo',
        display_name: 'SDXL Turbo',
        category: 'Image',
        series: 'Stable Diffusion',
        performance_tier: 'Balanced (3B - 7B)',
        size_mb: 6900,
        description: 'A revolutionary distilled version of Stable Diffusion XL optimized for real-time image generation. SDXL Turbo achieves remarkable speed improvements through adversarial training and distillation techniques, enabling single-step or few-step generation while maintaining high image quality. Produces detailed, high-resolution 1024x1024 images with excellent prompt adherence, vibrant colors, and impressive coherence. Perfect for interactive applications, real-time creative tools, rapid prototyping, and scenarios where generation speed is critical. Handles diverse artistic styles and maintains strong composition abilities.',
        icon_url: 'https://stability.ai/s/images/logo.svg'
      },
      {
        id: 'sd-1.5',
        engine: 'stable-diffusion',
        name: 'sd-1.5',
        display_name: 'Stable Diffusion 1.5',
        category: 'Image',
        series: 'Stable Diffusion',
        performance_tier: 'Balanced (3B - 7B)',
        size_mb: 4200,
        description: 'The classic and widely-adopted Stable Diffusion model that democratized AI image generation. SD 1.5 has become an industry standard, benefiting from extensive community fine-tuning, custom models, and LoRA adaptations. Generates 512x512 images with good detail, supports a vast ecosystem of extensions and custom models, and excels at artistic and illustrative styles. While newer models offer higher resolutions and better prompt adherence, SD 1.5 remains popular for its efficiency, extensive customization options, and proven reliability across diverse creative applications.',
        icon_url: 'https://stability.ai/s/images/logo.svg'
      },
      {
        id: 'sd-2.1',
        engine: 'stable-diffusion',
        name: 'sd-2.1',
        display_name: 'Stable Diffusion 2.1',
        category: 'Image',
        series: 'Stable Diffusion',
        performance_tier: 'Balanced (3B - 7B)',
        size_mb: 5200,
        description: 'An improved iteration of Stable Diffusion featuring enhanced training, better text encoding, and support for 768x768 resolution outputs. SD 2.1 demonstrates improved prompt understanding, more accurate rendering of complex scenes, better handling of multiple objects and spatial relationships, and enhanced detail in generated images. Offers superior photorealistic capabilities, improved handling of human anatomy, and better composition. Particularly strong at generating diverse artistic styles, architectural visualizations, and detailed illustrations while maintaining the open-source flexibility that made Stable Diffusion popular.',
        icon_url: 'https://stability.ai/s/images/logo.svg'
      }
    ];

    const insertEngines = db.prepare(
      "INSERT OR IGNORE INTO engines (id, name, type, docker_image, health_endpoint) VALUES (?, ?, ?, ?, ?)"
    );

    const insertModels = db.prepare(
      "INSERT OR IGNORE INTO models (id, engine, name, display_name, category, series, performance_tier, size_mb, description, icon_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );

    const seedTransaction = db.transaction(() => {
      for (const engine of engines)
        insertEngines.run(engine.id, engine.name, engine.type, engine.docker_image, engine.health_endpoint);

      for (const model of models)
        insertModels.run(
          model.id,
          model.engine,
          model.name,
          model.display_name,
          model.category,
          model.series,
          model.performance_tier,
          model.size_mb,
          model.description,
          model.icon_url
        );
    });

    seedTransaction();
    console.log("🌱 Seed data updated.");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}