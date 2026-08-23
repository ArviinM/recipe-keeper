import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  ChartColumn,
  CircleHelp,
  GraduationCap,
  Languages,
  ListChecks,
  LogIn,
  Send,
  Users,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireStaff } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Guide" };

/**
 * The teacher's manual, inside the app rather than in a separate document.
 *
 * Ordered by dependency, not by feature: sections must exist before students
 * can pick one when registering, English is written before Tagalog because it
 * is the fallback, and a quiz needs its own switch after the lesson is
 * published. Getting that order wrong is the main way a teacher gets stuck.
 */

const STEPS = [
  { id: "signin", label: "Sign in", icon: LogIn },
  { id: "sections", label: "Add your sections", icon: GraduationCap },
  { id: "students", label: "Add your students", icon: Users },
  { id: "lesson", label: "Write a lesson", icon: BookOpen },
  { id: "quiz", label: "Build the quiz", icon: ListChecks },
  { id: "publish", label: "Publish it", icon: Send },
  { id: "tagalog", label: "Add Tagalog", icon: Languages },
  { id: "results", label: "Check results", icon: ChartColumn },
  { id: "stuck", label: "If you get stuck", icon: CircleHelp },
] as const;

export default async function GuidePage() {
  await requireStaff();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight">Guide</h1>
        <p className="text-muted-foreground max-w-prose">
          Everything you need to set up the Cookery module and run it with your
          class. Work through it in order — each part depends on the one before
          it.
        </p>
      </header>

      {/* Jump links. Sequence is meaningful here, so they are numbered. */}
      <nav aria-label="Guide contents">
        <ol className="grid gap-2 sm:grid-cols-2">
          {STEPS.map((step, index) => (
            <li key={step.id}>
              <a
                href={`#${step.id}`}
                className="bg-card hover:bg-secondary/60 border-border flex min-h-11 items-center gap-3 rounded-lg border px-3 text-sm font-semibold transition-colors"
              >
                <span className="bg-secondary text-secondary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums">
                  {index + 1 <= 8 ? index + 1 : "?"}
                </span>
                {step.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Section
        id="signin"
        n={1}
        icon={LogIn}
        title="Sign in and pick your password"
        lede="You will only do this once."
      >
        <Numbered
          items={[
            <>Open the app and tap <Ui>Get Started</Ui>.</>,
            <>Enter the username and temporary password you were given, then tap <Ui>Sign In</Ui>.</>,
            <>You will be asked to choose your own password straight away. Pick something you will remember — at least 8 characters.</>,
          ]}
        />
        <p>
          You land on this dashboard. Down the side — or across the top on a
          phone — are <Ui>Overview</Ui>, <Ui>Recipes</Ui>, <Ui>Categories</Ui>,{" "}
          <Ui>Students</Ui>, <Ui>Sections</Ui> and <Ui>Results</Ui>.
        </p>
        <Note tone="good" title="Use a laptop for setting up">
          Everything works on a phone, including this dashboard. But writing
          recipes means a lot of typing, so a laptop is far more comfortable.
          Your students will be on phones.
        </Note>
      </Section>

      <Section
        id="sections"
        n={2}
        icon={GraduationCap}
        title="Add your class sections"
        lede="Do this before adding students — students pick their section when they register, so the sections have to exist first."
      >
        <Numbered
          items={[
            <>Open <Ui>Sections</Ui> and tap <Ui>Add section</Ui>.</>,
            <>Set the grade, the section name — for example <em>Sampaguita</em> — and the school year.</>,
            <>Choose the <strong>Language</strong> for that section: English or Tagalog.</>,
            <>Tap <Ui>Save</Ui>, then repeat for each section you teach.</>,
          ]}
        />
        <Note tone="warn" title="The language setting matters for your research">
          <p>
            Language is set <strong>per section</strong>, so a whole class reads
            the same one. That is deliberate. If some students read English and
            others Tagalog inside the same group, the language becomes an extra
            variable, and your panel can fairly ask whether the improvement came
            from the module or from the language.
          </p>
          <p className="mt-2">
            Keep one language per group unless you are comparing languages on
            purpose.
          </p>
        </Note>
      </Section>

      <Section
        id="students"
        n={3}
        icon={Users}
        title="Add your students"
        lede="Two ways to do this. Creating the accounts yourself is usually easier with a whole class."
      >
        <Numbered
          items={[
            <>Open <Ui>Students</Ui> and tap <Ui>Add account</Ui>.</>,
            <>Fill in the student&apos;s full name, email, username and section.</>,
            <>Tap <Ui>Create account</Ui>.</>,
          ]}
        />
        <Note tone="warn" title="Write the temporary password down immediately">
          <p>
            A password like <Mono>Adobo4821</Mono> appears on screen.{" "}
            <strong>It is shown once and never again.</strong> Write it down or
            hand it to the student before you close that box.
          </p>
          <p className="mt-2">
            The student chooses their own password the first time they sign in,
            so you never need to know it afterwards.
          </p>
        </Note>
        <p>
          The other option: students register themselves by tapping{" "}
          <Ui>Create an account</Ui> on the sign-in screen. They pick their
          section from a list, which is why sections come first.
        </p>
        <p>
          <strong>When a student forgets their password:</strong> open{" "}
          <Ui>Students</Ui>, find their name, tap <Ui>Reset password</Ui>, and
          give them the new temporary one. You cannot see their existing
          password, and you do not need to.
        </p>
        <p>
          Tap any student&apos;s <strong>name</strong> to see their progress,
          their best score on each lesson, and every attempt they have made.
        </p>
      </Section>

      <Section
        id="lesson"
        n={4}
        icon={BookOpen}
        title="Write a lesson"
        lede="This is where most of your time goes. Open Recipes and tap New Recipe."
      >
        <div className="flex flex-wrap gap-1.5">
          {["Basics", "Objectives", "Ingredients", "Procedure", "Techniques & Safety", "Quiz", "Publish"].map(
            (label, i) => (
              <span
                key={label}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-bold",
                  i === 0
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-muted-foreground border-border",
                )}
              >
                {i + 1} {label}
              </span>
            ),
          )}
        </div>

        <Note tone="good" title="There is no Save button, and that is fine">
          <p>
            Everything saves by itself as you type. You will see{" "}
            <strong>Saved automatically</strong> at the top right. You can close
            the page mid-sentence, come back tomorrow, and nothing is lost.
          </p>
          <p className="mt-2">
            You can also jump between the seven steps in any order using the
            numbered buttons, so it is fine to leave a section half-finished and
            return to it.
          </p>
        </Note>

        <SubHead>1 · Basics</SubHead>
        <p>
          Recipe name, category, a short description and a photo of the finished
          dish. Difficulty, servings and timings are optional.
        </p>
        <p>
          For a video, upload it to YouTube first and set it to{" "}
          <strong>Unlisted</strong> — that means only people with the link can
          watch it — then paste the link here.
        </p>

        <SubHead>2 · Objectives</SubHead>
        <p>
          What students should be able to do afterwards. They see these as{" "}
          <em>&ldquo;After this lesson, you should be able to…&rdquo;</em>. One
          per line.
        </p>

        <SubHead>3 · Ingredients</SubHead>
        <p>
          The measurement and the ingredient go in <strong>separate boxes</strong>{" "}
          — <Mono>1 kg</Mono> and <Mono>chicken</Mono> — so students see them
          clearly. The third box is for a note like <em>cut into serving pieces</em>.
        </p>

        <SubHead>4 · Procedure</SubHead>
        <p>
          One step at a time. Steps are numbered automatically, so if you reorder
          them with the arrows the numbers fix themselves. Each step can have its
          own photo.
        </p>

        <SubHead>5 · Techniques &amp; Safety</SubHead>
        <p>
          Tick the cooking techniques this recipe uses. The explanations are
          written once and shared by every recipe, so you never retype them.
        </p>
        <p>
          Then write the kitchen safety reminders and your chef&apos;s tips.{" "}
          <strong>Students see the safety section highlighted in red</strong>,
          before they start cooking.
        </p>

        <Note tone="plain" title="Photos">
          Use your own photos of the dishes wherever you can. Images taken from
          the internet can cause copyright problems in a published research
          module, and your own photos make the paper stronger.
        </Note>
      </Section>

      <Section
        id="quiz"
        n={5}
        icon={ListChecks}
        title="Build the quiz"
        lede="Step 6 of the recipe. Students take it after finishing the lesson, and it is scored automatically."
      >
        <Numbered
          items={[
            <>Write the question.</>,
            <>Fill in the four choices.</>,
            <><strong>Tap the letter of the correct answer</strong> so it turns green. This is the step people forget.</>,
            <>Tap <Ui>Add another question</Ui> and repeat.</>,
          ]}
        />
        <Note tone="warn" title="Leave “Show correct answers after submitting” switched off">
          It is off by default and it should stay off while your study is
          running. If students can see the answer key they can share it, and the
          scores stop measuring what they actually learned — which is the thing
          your research is about.
        </Note>
        <p>
          The second switch, <Ui>Quiz is available to students</Ui>, is what
          makes the quiz appear. Turn it on once every question has a correct
          answer marked.
        </p>
        <p>
          <strong>You can edit a question later without losing data.</strong>{" "}
          Fixing a typo keeps the answers students have already given. Only
          deleting a question removes its answers.
        </p>
      </Section>

      <Section
        id="publish"
        n={6}
        icon={Send}
        title="Publish it"
        lede="Until you publish, students cannot see the lesson at all."
      >
        <p>Step 7 shows a checklist of what is still missing:</p>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {[
            "Recipe has a name",
            "Short description written",
            "Photo of the dish added",
            "Learning objectives written",
            "Ingredients listed",
            "Procedure written",
            "Safety reminders written",
            "Quiz questions with a correct answer",
          ].map((item) => (
            <li key={item} className="text-muted-foreground flex gap-2 text-sm">
              <span className="bg-brand-wood mt-2 size-1.5 shrink-0 rounded-full" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <p>
          When you are ready, tap <Ui>Publish for students</Ui>. Nothing here is
          permanent — you can unpublish at any time, and{" "}
          <Ui>View as a student</Ui> shows exactly what they will see.
        </p>
        <p>
          Back on the <Ui>Recipes</Ui> list, use the{" "}
          <strong>up and down arrows</strong> to put your lessons in teaching
          order. Students see them in that order.
        </p>
      </Section>

      <Section
        id="tagalog"
        n={7}
        icon={Languages}
        title="Add Tagalog"
        lede="Only needed if the section you are teaching is set to Tagalog."
      >
        <Note tone="warn" title="Write English first">
          English is what students fall back to when a translation is missing,
          so fill it in before you translate. If you skip a Tagalog field,
          students simply see the English version of that line — never a blank.
        </Note>
        <Numbered
          items={[
            <>Open the recipe and find <Ui>Writing in</Ui> at the top.</>,
            <>Switch it to <strong>Tagalog</strong>. The fields swap to the Tagalog versions.</>,
            <>Translate what you want, then switch back to English whenever you like.</>,
          ]}
        />
        <p>
          While you are writing in Tagalog, the buttons for adding, removing and
          reordering are hidden, and you cannot change the correct answer. That
          is on purpose: translating only replaces words, so it can never
          accidentally change the structure of a lesson or the answer key.
        </p>
        <p>
          The <strong>Chicken Adobo</strong> lesson is already translated as an
          example of the register to write in.
        </p>
      </Section>

      <Section
        id="results"
        n={8}
        icon={ChartColumn}
        title="Check results"
        lede="Open Results."
      >
        <p>
          Each row is a student&apos;s <strong>best score</strong> on one lesson,
          with how many attempts they made. Retakes are encouraged — the best
          score counts, but every single attempt is stored.
        </p>
        <Note tone="good" title="For your manuscript">
          <Ui>Download CSV</Ui> gives you a spreadsheet of{" "}
          <strong>every attempt</strong>, not just the best one, with dates and
          attempt numbers. That is the file to use for the statistical analysis
          in your paper, so you will not have to retype anything.
        </Note>
      </Section>

      <Section id="stuck" icon={CircleHelp} title="If you get stuck">
        <div className="border-border overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[34rem] text-sm">
            <thead className="bg-muted/60">
              <tr className="text-left">
                <th className="px-3 py-2.5 font-semibold">What is happening</th>
                <th className="px-3 py-2.5 font-semibold">What to do</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["A student cannot sign in", <>Check the username in <Ui>Students</Ui> — it is easy to mistype. If it is the password, tap <Ui>Reset password</Ui>.</>],
                ["A student cannot see a lesson", <>It is still a draft. Open it and check step 7, <Ui>Publish</Ui>.</>],
                ["The lesson shows but there is no quiz", <>The quiz has its own switch. Step 6, turn on <Ui>Quiz is available to students</Ui>.</>],
                ["A student sees English in a Tagalog class", <>That line has not been translated yet. Open the recipe, switch <Ui>Writing in</Ui> to Tagalog, and fill it in.</>],
                ["I cannot delete a category", <>Recipes are still using it. Move them to another category first.</>],
                ["The first page is slow to open", <>Normal after a quiet period while the server wakes up. Open the app a minute before a class or a demo and it will be quick.</>],
                ["I published something by mistake", <>Nothing is permanent. Open the recipe, step 7, and tap <Ui>Unpublish</Ui>.</>],
              ].map(([problem, fix], i) => (
                <tr key={i} className="border-border border-t">
                  <td className="px-3 py-2.5 font-semibold">{problem}</td>
                  <td className="text-muted-foreground px-3 py-2.5">{fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Note tone="warn" title="Things that need the developer">
          Save these up rather than getting stuck on them: creating the very
          first account for a new teacher, changing the school name on the
          opening screen, and anything that needs a code change.
        </Note>

        <p className="text-muted-foreground text-sm">
          Students install the app by opening the address in their phone browser
          and choosing <strong>Add to Home Screen</strong>. It then has its own
          icon and opens without the browser bar.
        </p>
      </Section>

      <Separator />

      <p className="text-muted-foreground text-sm">
        Want to see what students see? Open{" "}
        <Link href="/recipes" className="text-primary font-semibold underline underline-offset-4">
          the recipe library
        </Link>{" "}
        — you will get a banner to come back here.
      </p>
    </div>
  );
}

/* ---------- small building blocks ---------- */

function Section({
  id,
  n,
  icon: Icon,
  title,
  lede,
  children,
}: {
  id: string;
  n?: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <div className="flex items-center gap-3">
        <span className="bg-secondary text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight">
            {n ? <span className="text-muted-foreground font-bold">{n}. </span> : null}
            {title}
          </h2>
        </div>
      </div>
      {lede && <p className="text-muted-foreground max-w-prose">{lede}</p>}
      <div className="max-w-prose space-y-4 leading-relaxed">{children}</div>
    </section>
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-2 font-bold">{children}</h3>;
}

function Numbered({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="bg-secondary text-secondary-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums">
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Note({
  tone,
  title,
  children,
}: {
  tone: "warn" | "good" | "plain";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        tone === "warn" && "border-primary/30 bg-secondary",
        tone === "good" && "border-brand-green/30 bg-accent",
        tone === "plain" && "border-brand-wood/40 bg-brand-cream",
      )}
    >
      <CardContent className="space-y-1">
        <h3 className="flex items-center gap-2 text-sm font-extrabold">
          {tone === "warn" && <AlertTriangle className="size-4 shrink-0" aria-hidden />}
          {title}
        </h3>
        <div className="text-sm leading-relaxed">{children}</div>
      </CardContent>
    </Card>
  );
}

function Ui({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-muted border-border rounded border px-1.5 py-0.5 text-[0.9em] font-bold whitespace-nowrap">
      {children}
    </span>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return <code className="bg-muted rounded px-1.5 py-0.5 text-[0.9em]">{children}</code>;
}
