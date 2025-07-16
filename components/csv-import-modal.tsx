'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'

interface ImportResult {
  success: boolean
  message: string
  data?: {
    total_processed: number
    successful_count: number
    failed_count: number
    failed_items: Array<{
      line: number
      error: string
      title: string
    }>
    invalid_contents: Array<{
      line: number
      error: string
      title: string
    }>
  }
}

export default function CSVImportModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setImportResult(null)
    } else {
      alert('请选择CSV文件')
    }
  }

  // 导入CSV数据
  const handleImport = async () => {
    if (!file) return

    setIsImporting(true)
    setImportResult(null)

    try {
      // 读取文件内容
      const csvData = await file.text()
      
      // 调用导入API
      const response = await fetch('/api/admin/explosive-contents/csv-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvData }),
      })

      const result: ImportResult = await response.json()
      setImportResult(result)

      if (result.success) {
        console.log('✅ CSV导入成功:', result.data)
      } else {
        console.error('❌ CSV导入失败:', result.message)
      }
    } catch (error) {
      console.error('❌ 导入过程中出错:', error)
      setImportResult({
        success: false,
        message: '导入过程中发生错误，请稍后重试'
      })
    } finally {
      setIsImporting(false)
    }
  }

  // 重置状态
  const handleReset = () => {
    setFile(null)
    setImportResult(null)
  }

  // 关闭模态框
  const handleClose = () => {
    setIsOpen(false)
    handleReset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          导入CSV数据
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>导入CSV数据</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 文件选择区域 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">选择CSV文件</CardTitle>
              <CardDescription>
                支持导入包含标题、内容、话题等字段的CSV文件
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {file && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    {file.name}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 导入按钮 */}
          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              disabled={!file || isImporting}
              className="flex-1"
            >
              {isImporting ? '导入中...' : '开始导入'}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isImporting}
            >
              重置
            </Button>
          </div>

          {/* 导入结果 */}
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  导入结果
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* 结果消息 */}
                  <div className={`p-3 rounded-md ${
                    importResult.success 
                      ? 'bg-green-50 text-green-800' 
                      : 'bg-red-50 text-red-800'
                  }`}>
                    {importResult.message}
                  </div>

                  {/* 统计信息 */}
                  {importResult.data && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {importResult.data.total_processed}
                        </div>
                        <div className="text-sm text-gray-600">总处理数</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {importResult.data.successful_count}
                        </div>
                        <div className="text-sm text-gray-600">成功导入</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {importResult.data.failed_count}
                        </div>
                        <div className="text-sm text-gray-600">导入失败</div>
                      </div>
                    </div>
                  )}

                  {/* 失败项目详情 */}
                  {importResult.data?.failed_items && importResult.data.failed_items.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-red-800">失败项目：</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {importResult.data.failed_items.map((item, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Badge variant="destructive">第{item.line}行</Badge>
                            <span className="text-gray-600">{item.title}</span>
                            <span className="text-red-600">- {item.error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 无效内容详情 */}
                  {importResult.data?.invalid_contents && importResult.data.invalid_contents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-orange-800">无效内容：</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {importResult.data.invalid_contents.map((item, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Badge variant="secondary">第{item.line}行</Badge>
                            <span className="text-gray-600">{item.title}</span>
                            <span className="text-orange-600">- {item.error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 