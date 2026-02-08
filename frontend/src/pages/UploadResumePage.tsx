import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { parseResume, isSupportedFileType, ParsedResumeData } from '../lib/resumeParser';
import { useAuth } from '../hooks/useAuth';
import { createResume } from '../lib/mockData';
import { CandidateType, EducationLevel, ExcellenceTag, RecruitmentScenario, SchoolTag, Source, SCHOOL_TAG_LABELS, EXCELLENCE_TAG_LABELS, EDUCATION_LEVEL_LABELS } from '../types';

const UploadResumePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    candidateName: '',
    email: '',
    phone: '',
    school: '',
    source: 'A',
    graduationYear: '27届',
    recruitmentScenario: 'DOMESTIC_BACHELOR_MASTER',
    candidateType: 'GRADUATE',
    schoolTag: '' as SchoolTag | '',
    excellenceTags: [] as ExcellenceTag[],
    educationLevel: '' as EducationLevel | '',
    remark: '',
    skills: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParsedResumeData | null>(null);
  const [autoParseEnabled, setAutoParseEnabled] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setParseResult(null);

      // 如果启用了自动解析且文件类型支持
      if (autoParseEnabled && isSupportedFileType(selectedFile)) {
        setIsParsing(true);
        try {
          const result = await parseResume(selectedFile);
          setParseResult(result);
          
          if (result.parseSuccess) {
            // 自动填充表单（仅填充空字段）
            setFormData(prev => ({
              ...prev,
              candidateName: prev.candidateName || result.candidateName || '',
              email: prev.email || result.email || '',
              phone: prev.phone || result.phone || '',
              school: prev.school || result.school || '',
              skills: prev.skills || (result.skills?.join(', ') || '')
            }));
          }
        } catch (error) {
          console.error('解析失败:', error);
        } finally {
          setIsParsing(false);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setIsUploading(true);
    try {
      createResume({
        candidateName: formData.candidateName,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        school: formData.school || undefined,
        source: formData.source as Source,
        graduationYear: formData.graduationYear,
        recruitmentScenario: formData.recruitmentScenario as RecruitmentScenario,
        candidateType: formData.candidateType as CandidateType,
        schoolTag: formData.schoolTag || undefined,
        excellenceTags: formData.excellenceTags.length > 0 ? formData.excellenceTags : undefined,
        educationLevel: formData.educationLevel || undefined,
        remark: formData.remark || undefined,
        skills: formData.skills ? formData.skills.split(',').map((item) => item.trim()).filter(Boolean) : undefined,
        resumeUrl: '/sample-resume.pdf',
        uploaderId: user.id,
        uploaderName: user.username,
        l2DepartmentId: 'dept-l2',
        l2DepartmentName: '二层',
        currentHandlerId: 'user-l2-1',
        currentHandlerName: 'l2_manager_1',
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      navigate('/resumes');
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">上传新简历</h1>
      
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 自动解析开关 */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">智能解析</span>
              <span className="text-xs text-blue-600">（自动提取姓名、邮箱、电话等）</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoParseEnabled}
                onChange={(e) => setAutoParseEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* File Upload Area */}
          <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md hover:bg-slate-50 transition-colors">
            <div className="space-y-1 text-center">
              {file ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center text-slate-700 mb-2">
                    <span className="font-medium">{file.name}</span>
                    <button 
                      type="button" 
                      onClick={() => {
                        setFile(null);
                        setParseResult(null);
                      }}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  
                  {/* 解析状态提示 */}
                  {isParsing && (
                    <div className="mt-3 flex items-center gap-2 text-blue-600">
                      <LoadingSpinner size="sm" />
                      <span className="text-sm">正在智能解析简历...</span>
                    </div>
                  )}
                  {parseResult && !isParsing && (
                    <div className={`mt-3 flex items-center gap-2 ${parseResult.parseSuccess ? 'text-green-600' : 'text-amber-600'}`}>
                      {parseResult.parseSuccess ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">解析完成，已自动填充</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">{parseResult.errorMessage || '请手动填写'}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-slate-400" />
                  <div className="flex text-sm text-slate-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                    >
                      <span>上传文件</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.doc,.docx" required />
                    </label>
                    <p className="pl-1">或拖拽至此</p>
                  </div>
                  <p className="text-xs text-slate-500">支持 PDF、DOC、DOCX，最大 10MB</p>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-slate-700">
                候选人姓名
                {parseResult?.candidateName && <span className="ml-2 text-xs text-green-600">(已识别)</span>}
              </label>
              <input
                type="text"
                required
                className="mt-1 input-field"
                value={formData.candidateName}
                onChange={e => setFormData({...formData, candidateName: e.target.value})}
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-slate-700">
                邮箱
                {parseResult?.email && <span className="ml-2 text-xs text-green-600">(已识别)</span>}
              </label>
              <input
                type="email"
                className="mt-1 input-field"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-slate-700">
                电话
                {parseResult?.phone && <span className="ml-2 text-xs text-green-600">(已识别)</span>}
              </label>
              <input
                type="tel"
                className="mt-1 input-field"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-slate-700">
                毕业院校
                {parseResult?.school && <span className="ml-2 text-xs text-green-600">(已识别)</span>}
              </label>
              <input
                type="text"
                className="mt-1 input-field"
                placeholder="如: 清华大学"
                value={formData.school}
                onChange={e => setFormData({...formData, school: e.target.value})}
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-slate-700">来源</label>
              <select
                className="mt-1 input-field"
                value={formData.source}
                onChange={e => setFormData({...formData, source: e.target.value})}
              >
                <option value="A">内部推荐</option>
                <option value="B">领英</option>
                <option value="C">招聘网站</option>
                <option value="D">猎头</option>
                <option value="E">招聘会</option>
                <option value="F">直接投递</option>
                <option value="G">其他</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-slate-700">应聘届次</label>
              <select
                className="mt-1 input-field"
                value={formData.graduationYear}
                onChange={e => setFormData({...formData, graduationYear: e.target.value})}
              >
                {['27届', '28届', '29届', '30届', '31届', '32届', '33届', '34届', '35届'].map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-slate-700">招聘场景</label>
              <select
                className="mt-1 input-field"
                value={formData.recruitmentScenario}
                onChange={e => setFormData({...formData, recruitmentScenario: e.target.value})}
              >
                <option value="DOMESTIC_BACHELOR_MASTER">国内本硕</option>
                <option value="DOMESTIC_PHD">国内博士</option>
                <option value="OVERSEAS_BACHELOR_MASTER">留学生本硕</option>
                <option value="OVERSEAS_PHD">留学生博士</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-slate-700">应届生/实习生</label>
              <select
                className="mt-1 input-field"
                value={formData.candidateType}
                onChange={e => setFormData({...formData, candidateType: e.target.value})}
              >
                <option value="GRADUATE">应届生</option>
                <option value="INTERN">实习生</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-slate-700">院校标签</label>
              <select
                className="mt-1 input-field"
                value={formData.schoolTag}
                onChange={e => setFormData({...formData, schoolTag: e.target.value as SchoolTag})}
              >
                <option value="">请选择</option>
                {Object.entries(SCHOOL_TAG_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-slate-700">最高学历</label>
              <select
                className="mt-1 input-field"
                value={formData.educationLevel}
                onChange={e => setFormData({...formData, educationLevel: e.target.value as EducationLevel})}
              >
                <option value="">请选择</option>
                {Object.entries(EDUCATION_LEVEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">优秀标签 (可多选)</label>
              <div className="flex flex-wrap gap-3">
                {Object.entries(EXCELLENCE_TAG_LABELS).map(([value, label]) => (
                  <label key={value} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={formData.excellenceTags.includes(value as ExcellenceTag)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, excellenceTags: [...formData.excellenceTags, value as ExcellenceTag]});
                        } else {
                          setFormData({...formData, excellenceTags: formData.excellenceTags.filter(t => t !== value)});
                        }
                      }}
                    />
                    <span className="text-sm text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-slate-700">
                技能标签 (逗号分隔)
                {parseResult?.skills && parseResult.skills.length > 0 && <span className="ml-2 text-xs text-green-600">(已识别)</span>}
              </label>
              <input
                type="text"
                className="mt-1 input-field"
                placeholder="React, Python, SQL..."
                value={formData.skills}
                onChange={e => setFormData({...formData, skills: e.target.value})}
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-slate-700">备注</label>
              <textarea
                className="mt-1 input-field h-24"
                placeholder="补充说明..."
                value={formData.remark}
                onChange={e => setFormData({...formData, remark: e.target.value})}
              />
            </div>
          </div>

          {/* 隐私说明 */}
          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
            <strong>隐私说明：</strong>智能解析完全在您的浏览器本地运行，简历内容不会上传到任何服务器。
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/resumes')}
              className="mr-3 btn-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isUploading || !file || isParsing}
              className="btn-primary"
            >
              {isUploading ? <LoadingSpinner size="sm" className="text-white" /> : '上传简历'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadResumePage;
