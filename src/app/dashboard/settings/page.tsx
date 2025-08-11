import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your account, team, and application settings.</p>
            </div>

            <Tabs defaultValue="profile">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="team">Team Members</TabsTrigger>
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Profile</CardTitle>
                            <CardDescription>Update your personal information and password.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" defaultValue="Jane Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" defaultValue="jane.doe@example.com" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input id="current-password" type="password" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input id="new-password" type="password" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button>Save Changes</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="team">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Members</CardTitle>
                            <CardDescription>Manage your team and their roles.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Team management interface will be here.</p>
                        </CardContent>
                        <CardFooter>
                            <Button>Add Team Member</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="permissions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Permissions</CardTitle>
                            <CardDescription>Configure access levels for different roles.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Permissions configuration interface will be here.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
