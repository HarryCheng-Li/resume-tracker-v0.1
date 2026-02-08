/**
 * 简历解析工具 - 纯前端实现
 * 支持PDF和Word文档文本提取，并使用正则表达式提取基础信息
 * 数据完全在本地处理，不会发送到任何服务器
 */

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// 配置PDF.js worker
// 使用CDN避免本地配置复杂性
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// 解析结果类型
export interface ParsedResumeData {
  candidateName?: string;
  email?: string;
  phone?: string;
  school?: string;
  skills?: string[];
  rawText: string;
  parseSuccess: boolean;
  errorMessage?: string;
}

/**
 * 从PDF文件提取文本
 */
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

/**
 * 从Word文档提取文本
 */
async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * 使用正则表达式从文本中提取字段
 */
function extractFieldsFromText(text: string): Omit<ParsedResumeData, 'rawText' | 'parseSuccess' | 'errorMessage'> {
  // 邮箱正则 - 匹配常见邮箱格式
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = text.match(emailRegex);
  const email = emailMatches ? emailMatches[0] : undefined;

  // 电话正则 - 支持中国手机号和座机
  const phoneRegex = /(?:(?:\+|00)86)?1[3-9]\d{9}|(?:0\d{2,3}-?)?\d{7,8}/g;
  const phoneMatches = text.match(phoneRegex);
  const phone = phoneMatches ? phoneMatches[0].replace(/-/g, '') : undefined;

  // 学校正则 - 匹配常见中国大学名称
  const universityKeywords = [
    '大学', '学院', 'University', 'College', 'Institute',
    '清华', '北大', '复旦', '交大', '浙大', '南大', '中科大',
    '北京大学', '清华大学', '复旦大学', '上海交通大学', '浙江大学',
    '南京大学', '中国科学技术大学', '武汉大学', '华中科技大学',
    '中山大学', '同济大学', '北京航空航天大学', '北京理工大学',
    '哈尔滨工业大学', '西安交通大学', '南开大学', '天津大学',
    '厦门大学', '山东大学', '四川大学', '吉林大学', '中南大学',
    '东南大学', '电子科技大学', '西北工业大学', '华南理工大学',
    '大连理工大学', '北京师范大学', '华东师范大学', '中国人民大学'
  ];
  
  let school: string | undefined;
  for (const keyword of universityKeywords) {
    const schoolRegex = new RegExp(`[\\u4e00-\\u9fa5A-Za-z]*${keyword}[\\u4e00-\\u9fa5A-Za-z]*`, 'g');
    const schoolMatches = text.match(schoolRegex);
    if (schoolMatches && schoolMatches[0].length > 2) {
      school = schoolMatches[0].slice(0, 20); // 限制长度
      break;
    }
  }

  // 姓名提取 - 尝试从文本开头提取（通常简历第一行是姓名）
  // 这是一个简化的启发式方法
  const lines = text.split(/[\n\r]+/).filter(line => line.trim().length > 0);
  let candidateName: string | undefined;
  
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // 如果第一行较短且不包含特殊字符，可能是姓名
    if (firstLine.length <= 10 && /^[\u4e00-\u9fa5A-Za-z\s]+$/.test(firstLine)) {
      candidateName = firstLine;
    } else {
      // 尝试提取中文姓名 (2-4个汉字)
      const chineseNameRegex = /^([\u4e00-\u9fa5]{2,4})\s/;
      const nameMatch = text.match(chineseNameRegex);
      if (nameMatch) {
        candidateName = nameMatch[1];
      }
    }
  }

  // 技能提取 - 匹配常见技术关键词
  const skillKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
    'React', 'Vue', 'Angular', 'Node.js', 'Next.js', 'Express',
    'HTML', 'CSS', 'SCSS', 'Tailwind', 'Bootstrap',
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Linux',
    'Git', 'CI/CD', 'Jenkins', 'GitHub Actions',
    'TensorFlow', 'PyTorch', '机器学习', '深度学习', '人工智能',
    'Spring', 'Django', 'Flask', 'FastAPI',
    '算法', '数据结构', '系统设计', '微服务'
  ];
  
  const textLower = text.toLowerCase();
  const skills = skillKeywords.filter(skill => 
    textLower.includes(skill.toLowerCase())
  );

  return {
    candidateName,
    email,
    phone,
    school,
    skills: skills.length > 0 ? skills : undefined
  };
}

/**
 * 主解析函数 - 根据文件类型选择解析方式
 */
export async function parseResume(file: File): Promise<ParsedResumeData> {
  const fileName = file.name.toLowerCase();
  
  try {
    let rawText: string;
    
    if (fileName.endsWith('.pdf')) {
      rawText = await extractTextFromPDF(file);
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      rawText = await extractTextFromDocx(file);
    } else {
      return {
        rawText: '',
        parseSuccess: false,
        errorMessage: '不支持的文件格式，请上传PDF或Word文档'
      };
    }

    // 如果文本太短，可能解析失败
    if (rawText.trim().length < 50) {
      return {
        rawText,
        parseSuccess: false,
        errorMessage: '无法从文件中提取足够的文本内容，可能是扫描件或图片格式'
      };
    }

    const extractedFields = extractFieldsFromText(rawText);

    return {
      ...extractedFields,
      rawText,
      parseSuccess: true
    };
  } catch (error) {
    console.error('简历解析失败:', error);
    return {
      rawText: '',
      parseSuccess: false,
      errorMessage: `解析失败: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}

/**
 * 检查文件类型是否支持解析
 */
export function isSupportedFileType(file: File): boolean {
  const fileName = file.name.toLowerCase();
  return fileName.endsWith('.pdf') || fileName.endsWith('.docx') || fileName.endsWith('.doc');
}
