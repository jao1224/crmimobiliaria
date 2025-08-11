"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { findMatchingProperties } from "@/lib/actions";
import { Wand2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export function PropertyMatcher() {
  const [open, setOpen] = useState(false);
  const [requirements, setRequirements] = useState("");
  const [matches, setMatches] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleMatch = async () => {
    setIsLoading(true);
    setMatches("");
    const result = await findMatchingProperties(requirements);
    if (result.success) {
      setMatches(result.data!);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Wand2 className="mr-2 h-4 w-4" />
          AI Property Matcher
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>AI Property Matcher</DialogTitle>
          <DialogDescription>
            Enter your client's requirements below. Our AI will suggest the best properties from your listings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="e.g., 'Looking for a 3-bedroom house with a large backyard and a modern kitchen, preferably in a quiet neighborhood. Budget is around $900,000.'"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            className="h-32"
          />
        </div>
        {matches && (
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Matching Properties</AlertTitle>
            <AlertDescription>
                <ScrollArea className="h-40">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{matches}</pre>
                </ScrollArea>
            </AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button onClick={handleMatch} disabled={isLoading || !requirements}>
            {isLoading ? "Finding Matches..." : "Find Matches"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
