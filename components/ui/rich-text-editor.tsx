"use client";

import {
  BtnBold,
  BtnBulletList,
  BtnClearFormatting,
  BtnItalic,
  BtnLink,
  BtnNumberedList,
  BtnRedo,
  BtnUnderline,
  BtnUndo,
  Editor,
  EditorProvider,
  Toolbar,
} from "react-simple-wysiwyg";
import { Label } from "@/components/ui/label";

type RichTextEditorProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  return (
    <div className="space-y-2">
      {label ? <Label>{label}</Label> : null}
      <div className="overflow-hidden rounded-[1.1rem] border border-input bg-background">
        <EditorProvider>
          <Editor
            value={value}
            onChange={(event) => onChange(event.target.value)}
            containerProps={{ style: { minHeight: "220px" } }}
            placeholder={placeholder}
          >
            <Toolbar>
              <BtnBold />
              <BtnItalic />
              <BtnUnderline />
              <BtnBulletList />
              <BtnNumberedList />
              <BtnLink />
              <BtnUndo />
              <BtnRedo />
              <BtnClearFormatting />
            </Toolbar>
          </Editor>
        </EditorProvider>
      </div>
    </div>
  );
}
