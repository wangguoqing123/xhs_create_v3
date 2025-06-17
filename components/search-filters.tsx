"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SearchFiltersProps {
  sortBy: string
  onSortChange: (value: string) => void
}

export function SearchFilters({ sortBy, onSortChange }: SearchFiltersProps) {
  return (
    <div className="flex gap-4">
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="排序方式" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="relevance">相关性</SelectItem>
          <SelectItem value="likes">点赞数</SelectItem>
          <SelectItem value="views">浏览量</SelectItem>
          <SelectItem value="time">发布时间</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
