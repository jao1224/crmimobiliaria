import { SalesReport } from "@/components/dashboard/sales-report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";

export default function ReportingPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Reports & Analytics</h1>
                    <p className="text-muted-foreground">Analyze performance with detailed reports and visualizations.</p>
                </div>
                <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <CardTitle>Sales Performance</CardTitle>
                            <CardDescription>View sales data with custom filters.</CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                             <Select>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by Team" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="team-a">Team A</SelectItem>
                                    <SelectItem value="team-b">Team B</SelectItem>
                                    <SelectItem value="team-c">Team C</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by Property Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="resale">Resale</SelectItem>
                                    <SelectItem value="new">New Construction</SelectItem>
                                    <SelectItem value="land">Land</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <SalesReport />
                </CardContent>
            </Card>
        </div>
    )
}
