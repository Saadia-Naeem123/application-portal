'use client';

import { useState } from 'react';
import {
  Mail,
  Search as SearchIcon,
  Download,
  Plus,
  Trash2,
  FileText,
  Inbox,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import Radio from '@/components/ui/Radio';
import Switch from '@/components/ui/Switch';
import DatePicker from '@/components/ui/DatePicker';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Accordion, AccordionItem } from '@/components/ui/Accordion';
import Tooltip from '@/components/ui/Tooltip';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Skeleton, { SkeletonCard } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import Avatar from '@/components/ui/Avatar';
import ProgressBar from '@/components/ui/ProgressBar';
import Dropdown, { DropdownItem, DropdownSeparator, DropdownLabel } from '@/components/ui/Dropdown';
import AppShell from '@/components/layout/AppShell';

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-6">{children}</div>
    </section>
  );
}

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  return (
    <AppShell
      title="Design System"
      description="Reusable UI components and layout primitives for the university portal"
      actions={
        <Button leftIcon={<Download />} variant="outline">
          Export Style Guide
        </Button>
      }
    >
      {/* Color palette */}
      <Section title="Color Palette">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { name: 'Primary', class: 'bg-primary-600' },
            { name: 'Success', class: 'bg-success-500' },
            { name: 'Warning', class: 'bg-warning-500' },
            { name: 'Error', class: 'bg-error-500' },
            { name: 'Info', class: 'bg-info-500' },
            { name: 'Neutral', class: 'bg-neutral-800' },
          ].map((c) => (
            <div key={c.name}>
              <div className={`h-16 rounded-lg ${c.class}`} />
              <p className="mt-2 text-xs font-medium text-neutral-600">{c.name}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography">
        <div className="space-y-2">
          <p className="text-4xl font-semibold text-neutral-900">Heading 4XL / Semibold</p>
          <p className="text-2xl font-semibold text-neutral-900">Heading 2XL / Semibold</p>
          <p className="text-xl font-semibold text-neutral-900">Heading XL / Semibold</p>
          <p className="text-md font-medium text-neutral-800">Subheading MD / Medium</p>
          <p className="text-base text-neutral-700">Body base — the default paragraph size used across the app.</p>
          <p className="text-sm text-neutral-500">Caption / helper text — sm size, muted color.</p>
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Buttons" description="Variants, sizes, icons, and states">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
          <Button variant="link">Link button</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Add"><Plus /></Button>
          <Button leftIcon={<Mail />}>With icon</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      {/* Badges */}
      <Section title="Badges / Status">
        <div className="flex flex-wrap gap-2.5">
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success" dot>Approved</Badge>
          <Badge variant="warning" dot>Pending</Badge>
          <Badge variant="error" dot>Rejected</Badge>
          <Badge variant="info" dot>In Review</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </Section>

      {/* Cards */}
      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card padded={false}>
            <CardHeader>
              <div>
                <CardTitle>Total Applications</CardTitle>
                <CardDescription>All time submissions</CardDescription>
              </div>
              <Badge variant="success">+12%</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-neutral-900">1,284</p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm">View details</Button>
            </CardFooter>
          </Card>
          <SkeletonCard />
          <Card>
            <p className="text-sm text-neutral-500">Legacy default Card (padded, no subcomponents) — unchanged for backwards compatibility.</p>
          </Card>
        </div>
      </Section>

      {/* Forms */}
      <Section title="Form Elements">
        <div className="grid gap-x-6 sm:grid-cols-2">
          <Input label="Full Name" placeholder="Jane Doe" leftIcon={<SearchIcon />} />
          <Input label="Email" type="email" placeholder="you@university.edu" error="Please enter a valid email address" />
          <Select label="Department" defaultValue="">
            <option value="" disabled>Select a department</option>
            <option>Computer Science</option>
            <option>Electrical Engineering</option>
          </Select>
          <DatePicker label="Submission Deadline" helperText="Applications close at 5:00 PM" />
          <Textarea label="Additional Notes" placeholder="Add any context for your reviewer…" containerClassName="sm:col-span-2" />
        </div>
        <div className="mt-2 flex flex-wrap gap-8">
          <Checkbox label="Email notifications" description="Get notified about status changes" defaultChecked />
          <Radio label="Urgent priority" name="priority" />
          <Switch label="Auto-save drafts" defaultChecked />
        </div>
      </Section>

      {/* Tabs & Accordion */}
      <Section title="Tabs & Accordion">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Overview panel content goes here.</TabsContent>
          <TabsContent value="activity">Recent activity panel content goes here.</TabsContent>
          <TabsContent value="settings">Settings panel content goes here.</TabsContent>
        </Tabs>

        <div className="mt-6">
          <Accordion defaultOpen={['faq-1']}>
            <AccordionItem id="faq-1" title="How do I submit a new application?">
              Go to New Application from the sidebar and follow the guided form.
            </AccordionItem>
            <AccordionItem id="faq-2" title="How long does review take?">
              Most applications are reviewed within 3–5 business days.
            </AccordionItem>
          </Accordion>
        </div>
      </Section>

      {/* Feedback */}
      <Section title="Feedback & Overlays">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button variant="outline" onClick={() => toast({ title: 'Application submitted', description: 'We\u2019ll notify you once it\u2019s reviewed.', variant: 'success' })}>
            Trigger Success Toast
          </Button>
          <Button variant="outline" onClick={() => toast({ title: 'Something went wrong', description: 'Please try again.', variant: 'error' })}>
            Trigger Error Toast
          </Button>
          <Tooltip content="This action cannot be undone">
            <Button variant="danger" leftIcon={<Trash2 />}>Delete</Button>
          </Tooltip>
          <Spinner />
        </div>
        <div className="mt-6 max-w-md">
          <ProgressBar value={68} showValue label="Application review progress" />
        </div>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Confirm submission"
          description="You won't be able to edit this application after submitting."
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={() => setModalOpen(false)}>Confirm & Submit</Button>
            </>
          }
        >
          <p className="text-sm text-neutral-600">Review your application details before final submission.</p>
        </Modal>
      </Section>

      {/* Avatars & Dropdown */}
      <Section title="Avatars & Dropdown Menu">
        <div className="flex items-center gap-3">
          <Avatar name="Ayesha Khan" size="lg" />
          <Avatar name="Bilal Ahmed" size="md" />
          <Avatar name="Sana Malik" size="sm" />
          <Avatar name="Omar Farooq" size="xs" />
          <Dropdown
            trigger={<Button variant="outline">Actions menu</Button>}
          >
            <DropdownLabel>Application #A-1042</DropdownLabel>
            <DropdownSeparator />
            <DropdownItem><FileText className="h-4 w-4 text-neutral-400" />View details</DropdownItem>
            <DropdownItem>Reassign reviewer</DropdownItem>
            <DropdownSeparator />
            <DropdownItem danger><Trash2 className="h-4 w-4" />Delete</DropdownItem>
          </Dropdown>
        </div>
      </Section>

      {/* Table */}
      <Section title="Data Table" description="Sticky header, hover rows, status badges">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Application</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              { id: 'A-1042', name: 'Ayesha Khan', status: 'success', label: 'Approved', date: 'Jul 21, 2026' },
              { id: 'A-1043', name: 'Bilal Ahmed', status: 'warning', label: 'Pending', date: 'Jul 22, 2026' },
              { id: 'A-1044', name: 'Sana Malik', status: 'error', label: 'Rejected', date: 'Jul 24, 2026' },
            ].map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium text-neutral-900">{row.id}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>
                  <Badge variant={row.status as 'success' | 'warning' | 'error'} dot>{row.label}</Badge>
                </TableCell>
                <TableCell>{row.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      {/* Loading & Empty states */}
      <Section title="Loading & Empty States">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Skeleton</p>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Empty State</p>
            <EmptyState
              icon={<Inbox className="h-5 w-5" />}
              title="No applications yet"
              description="Applications you submit will appear here."
              action={<Button size="sm">New Application</Button>}
            />
          </div>
        </div>
      </Section>
    </AppShell>
  );
}
