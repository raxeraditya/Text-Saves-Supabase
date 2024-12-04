"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Save, CheckCircle, Bold, Italic } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import supabase from "../lib/supabase";
import { Button } from "./ui/button";

// Define the type for each message
type Message = {
  content: string;
};

export default function AutoSaveEditor() {
  const [text, setText] = useState("");
  const [isSaved, setIsSaved] = useState(true);
  const [userId, setUserId] = useState("");
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  // Explicitly define the messages state type as an array of Message objects
  const [messages, setMessages] = useState<Message[]>([]);

  // Set or get the user ID from sessionStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("editor_user_id");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = uuidv4(); // Generate a new unique ID
      localStorage.setItem("editor_user_id", newUserId);
      setUserId(newUserId);
    }
  }, []);

  // Load all messages from Supabase on component mount
  useEffect(() => {
    if (userId) {
      const loadMessages = async () => {
        const { data, error } = await supabase
          .from("editor_content")
          .select("content")
          .eq("user_id", userId);

        if (error) {
          console.error("Error loading messages:", error);
        } else {
          setMessages(data); // Directly store the fetched array
        }
      };

      loadMessages();
    }
  }, [userId, isSaved]);

  // Auto-save functionality
  useEffect(() => {
    const saveText = async () => {
      const { data, error: fetchError } = await supabase
        .from("editor_content")
        .select("content")
        .eq("user_id", userId)
        .single(); // Only fetch one row, assuming 'user_id' is unique

      if (fetchError) {
        console.error("Error fetching current content:", fetchError);
        return;
      }

      const updatedText = data ? data.content + "\n\n" + text : text;

      const { error } = await supabase
        .from("editor_content")
        .upsert({ user_id: userId, content: updatedText });

      if (error) {
        console.error("Error saving text:", error);
      } else {
        setIsSaved(true);
        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 2000);
      }
    };

    if (!isSaved && userId) {
      const timer = setTimeout(saveText, 3000);
      return () => clearTimeout(timer);
    }
  }, [text, isSaved, userId]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setIsSaved(false);
  };

  const applyFormatting = (type: "bold" | "italic") => {
    const textarea = document.querySelector("textarea");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);
    const beforeText = text.substring(0, start);
    const afterText = text.substring(end);

    let formattedText = "";
    let cursorOffset = 2;

    if (type === "bold") {
      formattedText =
        selectedText.startsWith("**") && selectedText.endsWith("**")
          ? selectedText.slice(2, -2)
          : `**${selectedText}**`;
      cursorOffset = selectedText.startsWith("**") ? -2 : 2;
    } else if (type === "italic") {
      formattedText =
        selectedText.startsWith("*") && selectedText.endsWith("*")
          ? selectedText.slice(1, -1)
          : `*${selectedText}*`;
      cursorOffset = selectedText.startsWith("*") ? -1 : 1;
    }

    const newText = beforeText + formattedText + afterText;
    setText(newText);
    setIsSaved(false);

    // Set cursor position after the inserted formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, end + cursorOffset);
    }, 0);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              Enhanced Text Editor
            </motion.span>
            <AnimatePresence mode="wait">
              {isSaved ? (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center text-green-500"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Saved
                </motion.span>
              ) : (
                <motion.span
                  key="saving"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center text-yellow-500"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Saving...
                </motion.span>
              )}
            </AnimatePresence>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <motion.div
              className="relative flex-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-2 flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyFormatting("bold")}
                  aria-label="Bold"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyFormatting("italic")}
                  aria-label="Italic"
                >
                  <Italic className="w-4 h-4" />
                </Button>
              </div>
              <Textarea
                value={text}
                onChange={handleTextChange}
                placeholder="Start typing here..."
                className="min-h-[300px] md:min-h-[400px] resize-none"
              />
              <div className="mt-2 text-sm text-gray-500">
                Words: {text.trim().split(/\s+/).filter(Boolean).length} |
                Characters: {text.length}
              </div>
              <AnimatePresence>
                {showSavedMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg"
                  >
                    Text saved successfully!
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Display all messages */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Saved Messages
            </h3>
            <div className="space-y-2 mt-2">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-gray-100 p-4 rounded-md shadow-sm"
                >
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {msg.content}
                  </pre>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
