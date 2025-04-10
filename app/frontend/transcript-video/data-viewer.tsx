"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Download } from "lucide-react"; // Import the Download icon from lucide-react

type Props = {
  data: any;
};

export default function DataViewer({ data }: Props) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Function to download content as a .txt file
  const downloadFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Prepare content for each format
  const downloadText = () => {
    const textContent = data[0].text;
    downloadFile(textContent, "transcription_text.txt");
  };

  const downloadJson = () => {
    const jsonContent = JSON.stringify(data[0], null, 2);
    downloadFile(jsonContent, "transcription_json.txt");
  };

  const downloadTimestamps = () => {
    const timestampContent = data[0].chunks
      .map((chunk: any) => `${chunk.timestamp[0]}s - ${chunk.timestamp[1]}s: ${chunk.text}`)
      .join("\n");
    downloadFile(timestampContent, "transcription_timestamps.txt");
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header Section with Processing Info and Download Button */}
      <div className="flex justify-between items-center">
        <div></div> {/* Empty div to maintain flex alignment */}
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 text-sm px-2 py-1 rounded-lg border-gray-300 border text-gray-600">
            <span className="font-medium">~{data[1].toFixed(2)}s</span>
          </div>
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={downloadText}>Text</DropdownMenuItem>
              <DropdownMenuItem onClick={downloadTimestamps}>Timestamps</DropdownMenuItem>
              <DropdownMenuItem onClick={downloadJson}>JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="timestamps" className="w-full">
        <TabsList className="mb-2">
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="timestamps">Timestamps</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
        </TabsList>
        <TabsContent
          className="bg-gray-100 px-5 py-3 rounded-lg border-gray-300 border text-gray-600 h-fit max-h-[60vh] overflow-y-auto"
          value="text"
        >
          <p>{data[0].text}</p>
        </TabsContent>
        <TabsContent
          className="bg-gray-100 px-5 py-3 rounded-lg border-gray-300 border text-gray-600 h-fit max-h-[60vh] overflow-y-auto"
          value="timestamps"
        >
          {data[0].chunks.map((chunk: any, index: number) => (
            <div className="border-b py-3 last:border-b-0" key={index}>
              <p className="text-gray-800">{chunk.text}</p>
              <p className="text-sm text-gray-500">
                {chunk.timestamp[0]}s - {chunk.timestamp[1]}s
              </p>
            </div>
          ))}
        </TabsContent>
        <TabsContent
          className="bg-gray-100 px-5 py-3 rounded-lg border-gray-300 border text-gray-600 font-mono h-fit max-h-[60vh] overflow-y-auto"
          value="json"
        >
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">
            {JSON.stringify(data[0], null, 2)}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}