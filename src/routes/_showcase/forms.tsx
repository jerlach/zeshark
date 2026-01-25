import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FormField } from '@/components/forms/_form-field'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/_showcase/forms')({
  component: FormsShowcase,
})

function Section({ title, description, children }: { 
  title: string
  description?: string
  children: React.ReactNode 
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}

function FormsShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Forms</h1>
        <p className="text-muted-foreground mt-2">
          Form layouts, validation states, and field types
        </p>
      </div>

      {/* Basic Form */}
      <Section title="Basic Form" description="Simple form with standard fields">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Create Customer</CardTitle>
            <CardDescription>Add a new customer to your database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select defaultValue="active">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Additional notes..." />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Create Customer</Button>
          </CardFooter>
        </Card>
      </Section>

      {/* Form with Sections */}
      <Section title="Sectioned Form" description="Form organized into logical sections">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Edit Order</CardTitle>
            <CardDescription>Modify order details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Section 1 */}
            <div>
              <h3 className="text-sm font-medium mb-4">Basic Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="orderRef">Order Reference</Label>
                  <Input id="orderRef" defaultValue="ORD-2024-001" readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select defaultValue="pending">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="fulfilled">Fulfilled</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 2 */}
            <div>
              <h3 className="text-sm font-medium mb-4">Financial Details</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="subtotal">Subtotal</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input id="subtotal" type="number" defaultValue="1000.00" className="pl-7" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax">Tax (IVA)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input id="tax" type="number" defaultValue="160.00" className="pl-7" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total">Total</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input id="total" type="number" defaultValue="1160.00" className="pl-7 bg-muted" readOnly />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 3 */}
            <div>
              <h3 className="text-sm font-medium mb-4">Dates</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="transDate">Transaction Date</Label>
                  <Input id="transDate" type="date" defaultValue="2024-01-15" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settleDate">Settlement Date</Label>
                  <Input id="settleDate" type="date" />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>
      </Section>

      {/* Validation States */}
      <Section title="Validation States" description="How fields look with errors and success">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Form Validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="valid">Valid Field</Label>
              <Input id="valid" defaultValue="john@example.com" className="border-green-500 focus-visible:ring-green-500" />
              <p className="text-xs text-green-600">Email is valid</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="error" className="text-destructive">Error Field</Label>
              <Input id="error" defaultValue="invalid-email" className="border-destructive focus-visible:ring-destructive" />
              <p className="text-xs text-destructive">Please enter a valid email address</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="required">
                Required Field <span className="text-destructive">*</span>
              </Label>
              <Input id="required" placeholder="This field is required" className="border-destructive" />
              <p className="text-xs text-destructive">This field is required</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warning">Warning State</Label>
              <Input id="warning" defaultValue="Short" className="border-yellow-500 focus-visible:ring-yellow-500" />
              <p className="text-xs text-yellow-600">Password should be at least 8 characters</p>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Field Types using FormField component */}
      <Section title="Field Types" description="All available input types using the FormField component">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Input Types</CardTitle>
            <CardDescription>Using the generated FormField component</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Text Input"
                placeholder="Enter text..."
                value=""
                onChange={() => {}}
              />
              <FormField
                label="Email"
                inputType="email"
                placeholder="email@example.com"
                value=""
                onChange={() => {}}
              />
              <FormField
                label="Number"
                inputType="number"
                placeholder="0"
                value=""
                onChange={() => {}}
              />
              <FormField
                label="Currency"
                inputType="currency"
                placeholder="0.00"
                value=""
                onChange={() => {}}
              />
              <FormField
                label="Date"
                inputType="date"
                value=""
                onChange={() => {}}
              />
              <FormField
                label="Date & Time"
                inputType="datetime"
                value=""
                onChange={() => {}}
              />
            </div>
            
            <FormField
              label="Select"
              inputType="select"
              options={[
                { label: 'Option 1', value: 'opt1' },
                { label: 'Option 2', value: 'opt2' },
                { label: 'Option 3', value: 'opt3' },
              ]}
              value=""
              onChange={() => {}}
            />

            <FormField
              label="Textarea"
              inputType="textarea"
              placeholder="Enter longer text..."
              description="This is helper text for the field"
              value=""
              onChange={() => {}}
            />

            <FormField
              label="Field with Error"
              error="This field has an error"
              value=""
              onChange={() => {}}
            />

            <FormField
              label="Read Only"
              readOnly
              value="This value cannot be changed"
              onChange={() => {}}
            />

            <FormField
              label="Disabled"
              disabled
              value="Disabled field"
              onChange={() => {}}
            />
          </CardContent>
        </Card>
      </Section>

      {/* Loading State */}
      <Section title="Loading State" description="Form during submission">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Creating...</CardTitle>
            <CardDescription>Please wait while we save your changes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input defaultValue="John Doe" disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue="john@example.com" disabled />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </Button>
          </CardFooter>
        </Card>
      </Section>

      {/* Inline Form */}
      <Section title="Inline Form" description="Compact form for quick actions">
        <Card className="max-w-xl">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input placeholder="Enter email to subscribe..." className="flex-1" />
              <Button>Subscribe</Button>
            </div>
          </CardContent>
        </Card>
      </Section>
    </div>
  )
}
