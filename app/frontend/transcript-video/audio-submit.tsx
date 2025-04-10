"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Button, buttonVariants } from "../components/ui/button";
import DataViewer from "./data-viewer";

type Props = {
  setFile: React.Dispatch<React.SetStateAction<File | undefined>>;
  file: File;
};

const submitAudioToServer = async (file: File) => {
  const formData = new FormData();
  formData.append("audio", file);
  const response = await fetch(
    "https://vnf2apkb--whisper-v24-entrypoint.modal.run/transcribe-text/",
    {
      method: "POST",
      body: formData,
    }
  );
  if (!response.ok) throw new Error("Failed to transcribe audio");
  return response.json();
};

export default function AudioSubmit({ setFile, file }: Props) {
  const [open, setOpen] = useState(false);
  const [transcriptionData, setTranscriptionData] = useState<any>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: submitAudioToServer,
    onSuccess: (data) => {
      setTranscriptionData(data); // Store transcription data
      toast.success("Transcription completed successfully!", {
        action: {
          label: "View Transcript",
          onClick: () => setOpen(true), // Open modal on button click
        },
      });
    },
    onError: (error) => {
      toast.error(`Failed to send file: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    mutate(file);
  };

  const resetForm = () => {
    setFile(undefined);
    setOpen(false);
    setTranscriptionData(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="text-left">
            <DialogTitle>Transcription Results</DialogTitle>
            <DialogDescription>
              Here is the transcription of your audio file. You can view the text, timestamps, or raw JSON data below.
            </DialogDescription>
          </DialogHeader>
          {transcriptionData && <DataViewer data={transcriptionData} />}
          <DialogFooter>
            <div className="flex gap-2 justify-end mt-2">
              <Button className="w-fit" onClick={resetForm}>
                Upload A New File
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button disabled={isPending} onClick={handleSubmit}>
        {isPending ? "Sending ..." : "Send It !"}
      </Button>

      {transcriptionData && !open && (
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => setOpen(true)}
        >
          View Transcript
        </Button>
      )}
    </>
  );
}