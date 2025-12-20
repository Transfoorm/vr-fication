'use client';

import '@/features/admin/showcase-bundle/showcase-bundle.css';
import { Card, Button, Input, Icon, Tooltip, T } from '@/prebuilts';

export default function Tooltips() {
  return (
    <Card.standard
      title="Tooltips Showcase"
      subtitle="Testing tooltip examples with various elements"
    >
      <div className="ft-showcasetabs-tooltips-container">
        {/* Title Section */}
        <div>
          <Tooltip.caret content="These are interactive elements for the page. This is an example of a tooltip that you can hover over a title to display helpful information and context about the section below. Tooltips are great for providing additional details without cluttering the interface." size="lg">
            <T.h3 weight="semibold">Interactive Elements</T.h3>
          </Tooltip.caret>
        </div>

        {/* Button Example */}
        <div>
          <Tooltip.caret content="Click on this link and it will take you to a page">
            <Button.primary>Hover Me</Button.primary>
          </Tooltip.caret>
        </div>

        {/* Radio Example */}
        <div>
          <Input.radio
            value="option1"
            onChange={() => {}}
            options={[
              {
                value: 'option1',
                label: 'Option 1',
                tooltip: 'This is for option one',
                tooltipSize: 'sm',
                tooltipSide: 'left'
              },
              {
                value: 'option2',
                label: 'Option 2',
                tooltip: 'We use MD for option two because it has a few more words than what option one had',
                tooltipSize: 'md',
                tooltipSide: 'top'
              },
              {
                value: 'option3',
                label: 'Option 3',
                tooltip: 'Option three uses the large tooltip size to demonstrate how tooltips can contain longer blocks of text. This is useful when you need to provide detailed explanations, instructions, or contextual information that wouldn\'t fit in a smaller tooltip. The large size gives you plenty of room to communicate complex ideas while still maintaining good readability and a clean interface.',
                tooltipSize: 'lg',
                tooltipSide: 'bottom'
              },
              {
                value: 'option4',
                label: 'Option 4',
                tooltip: 'We use RHS for option four because it will be out of the way',
                tooltipSize: 'md',
                tooltipSide: 'right'
              }
            ]}
            direction="horizontal"
          />
        </div>

        {/* Lorem Ipsum Paragraph */}
        <div>
          <T.body>
            Lorem ipsum dolor sit amet,{' '}
            <Tooltip.caret content="This word uses Button.link VR with a small tooltip on top" size="sm" side="top">
              <Button.link onClick={() => {}} className="ft-showcasetabs-tooltips-link-inline">consectetur</Button.link>
            </Tooltip.caret>
            {' '}adipiscing elit. Sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
            quis nostrud{' '}
            <Tooltip.caret content="This demonstrates a medium-sized tooltip appearing on the bottom of an underlined word" size="md" side="bottom">
              <u className="ft-showcasetabs-tooltips-underline">exercitation</u>
            </Tooltip.caret>
            {' '}ullamco laboris nisi ut aliquip ex ea commodo
            consequat. Duis aute irure dolor in{' '}
            <Tooltip.caret content="Here's a larger tooltip with more detailed information about this underlined Latin word, showing how tooltips can contain longer explanatory text" size="lg" side="left">
              <u className="ft-showcasetabs-tooltips-underline">reprehenderit</u>
            </Tooltip.caret>
            {' '}in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur.{' '}
            <Tooltip.caret content="Info icon at the end of paragraph" size="sm" side="top" trigger="click" closeOnMouseLeave={true}>
              <span className="ft-showcasetabs-tooltips-icon-wrapper">
                <Icon variant="info" size="xs" className="ft-showcasetabs-tooltips-icon-color" />
              </span>
            </Tooltip.caret>
          </T.body>
          <T.body>
            Space import info icon and a tooltip{' '}
            <Tooltip.caret content="Hover me version hover" size="sm" side="top" trigger="hover">
              <span className="ft-showcasetabs-tooltips-icon-wrapper">
                <Icon variant="info" size="xs" className="ft-showcasetabs-tooltips-icon-color" />
              </span>
            </Tooltip.caret>
            {' '}hover me version hover.
          </T.body>
        </div>

        {/* Icon Examples */}
        <div className="ft-showcasetabs-tooltips-icons-row">
          <div className="ft-showcasetabs-tooltips-icons-item">
            <T.body>Click on stays on until you unclick me:</T.body>
            <Tooltip.caret content="Click to toggle this tooltip on and off" size="sm" side="top" trigger="click">
              <Icon
                variant="info"
                size="md"
                className="ft-showcasetabs-tooltips-icon-accent"
              />
            </Tooltip.caret>
          </div>

          <div className="ft-showcasetabs-tooltips-icons-item">
            <T.body>Hover me and click off:</T.body>
            <Tooltip.caret content="This is a standard hover tooltip but when you click it disapears." size="sm" side="top" dismissOnClick={true}>
              <Icon
                variant="alert-circle"
                size="md"
                className="ft-showcasetabs-tooltips-icon-warning"
              />
            </Tooltip.caret>
          </div>
        </div>

        <hr className="ft-showcasetabs-tooltips-divider" />

        {/* Documentation Section */}
        <div className="ft-showcasetabs-tooltips-docs">
          <T.h3 weight="semibold">Tooltip Implementation Guide</T.h3>
          <T.body size="md">
            All tooltips use the <strong>Tooltip.caret</strong> VR component. This keeps tooltip logic contained within the VR architecture, preventing page infection. Each variation below demonstrates different configurations.
          </T.body>

          <div className="ft-showcasetabs-tooltips-docs-list">
            {/* Style 1 */}
            <div>
              <T.h3 weight="semibold">1. Large Hover Tooltip on Title</T.h3>
              <T.body size="sm"><strong>VR:</strong> Tooltip.caret</T.body>
              <T.body size="sm"><strong>Usage:</strong> Large informational tooltip on headings</T.body>
              <pre className="ft-showcasetabs-tooltips-code-block">
{`<Tooltip.caret content="..." size="lg">
  <h3>Interactive Elements</h3>
</Tooltip.caret>`}
              </pre>
              <T.body size="sm"><strong>Props:</strong> size=&quot;lg&quot;, trigger defaults to &quot;hover&quot;</T.body>
            </div>

            {/* Style 2 */}
            <div>
              <T.h3 weight="semibold">2. Button Hover Tooltip</T.h3>
              <T.body size="sm"><strong>VR:</strong> Tooltip.caret</T.body>
              <T.body size="sm"><strong>Usage:</strong> Standard tooltip on buttons</T.body>
              <pre className="ft-showcasetabs-tooltips-code-block">
{`<Tooltip.caret content="Click on this link and it will take you to a page">
  <Button.primary>Hover Me</Button.primary>
</Tooltip.caret>`}
              </pre>
              <T.body size="sm"><strong>Props:</strong> size defaults to &quot;sm&quot;, trigger defaults to &quot;hover&quot;</T.body>
            </div>

            {/* Style 3 */}
            <div>
              <T.h3 weight="semibold">3. Radio Button Tooltips (Directional)</T.h3>
              <T.body size="sm"><strong>VR:</strong> Input.radio with built-in tooltip support</T.body>
              <T.body size="sm"><strong>Usage:</strong> Per-option tooltips with custom positioning</T.body>
              <pre className="ft-showcasetabs-tooltips-code-block">
{`<Input.radio
  options={[{
    value: 'option1',
    label: 'Option 1',
    tooltip: 'This is for option one',
    tooltipSize: 'sm',
    tooltipSide: 'left'
  }]}
/>`}
              </pre>
              <T.body size="sm"><strong>Props:</strong> tooltipSize (sm/md/lg), tooltipSide (top/bottom/left/right)</T.body>
            </div>

            {/* Style 4 */}
            <div>
              <T.h3 weight="semibold">4. Inline Link with Tooltip</T.h3>
              <T.body size="sm"><strong>VR:</strong> Tooltip.caret + Button.link</T.body>
              <T.body size="sm"><strong>Usage:</strong> Clickable inline text with tooltip</T.body>
              <pre className="ft-showcasetabs-tooltips-code-block">
{`<Tooltip.caret content="..." size="sm" side="top"
  <Button.link onClick={() => {}}
    className="compact-link">
    consectetur
  </Button.link>
</Tooltip.caret>`}
              </pre>
              <T.body size="sm"><strong>Props:</strong> Use CSS class for compact button styling</T.body>
            </div>

            {/* Style 5 */}
            <div>
              <T.h3 weight="semibold">5. Underlined Text with Tooltip (Medium)</T.h3>
              <T.body size="sm"><strong>VR:</strong> Tooltip.caret</T.body>
              <T.body size="sm"><strong>Usage:</strong> Underlined text with medium tooltip below</T.body>
              <pre className="ft-showcasetabs-tooltips-code-block">
{`<Tooltip.caret content="..." size="md" side="bottom"
  <u className="tooltip-trigger">
    exercitation
  </u>
</Tooltip.caret>`}
              </pre>
              <T.body size="sm"><strong>Props:</strong> size=&quot;md&quot;, side=&quot;bottom&quot;</T.body>
            </div>

            {/* Style 6 */}
            <div>
              <T.h3 weight="semibold">6. Underlined Text with Tooltip (Large, Left)</T.h3>
              <T.body size="sm"><strong>VR:</strong> Tooltip.caret</T.body>
              <T.body size="sm"><strong>Usage:</strong> Large tooltip positioned to the left</T.body>
              <pre className="ft-showcasetabs-tooltips-code-block">
{`<Tooltip.caret content="..." size="lg" side="left"
  <u className="tooltip-trigger">
    reprehenderit
  </u>
</Tooltip.caret>`}
              </pre>
              <T.body size="sm"><strong>Props:</strong> size=&quot;lg&quot;, side=&quot;left&quot;</T.body>
            </div>

            {/* Style 7 */}
            <div>
              <T.h3 weight="semibold">7. Click-to-Open, Hover-to-Close Icon Tooltip</T.h3>
              <T.body size="sm"><strong>VR:</strong> Tooltip.caret</T.body>
              <T.body size="sm"><strong>Usage:</strong> Click opens tooltip, moving mouse away closes it</T.body>
              <pre className="ft-showcasetabs-tooltips-code-block">
{`<Tooltip.caret content="..." size="sm" side="top"
  trigger="click" closeOnMouseLeave={true}>
  <div className="ft-showcasetabs-tooltips-icon-wrapper">
    <Icon variant="info" size="xs" className="ft-showcasetabs-tooltips-icon-color" />
  </span>
</Tooltip.caret>`}
              </pre>
              <T.body size="sm"><strong>Props:</strong> trigger=&quot;click&quot;, closeOnMouseLeave={true}</T.body>
            </div>

            {/* Style 8 */}
            <div>
              <T.h3 weight="semibold">8. Standard Hover Icon Tooltip</T.h3>
              <T.body size="sm"><strong>VR:</strong> Tooltip.caret</T.body>
              <T.body size="sm"><strong>Usage:</strong> Standard hover tooltip on info icon</T.body>
              <pre className="ft-showcasetabs-tooltips-code-block">
{`<Tooltip.caret content="Hover me version hover" size="sm" side="top"
  <div className="ft-showcasetabs-tooltips-icon-wrapper">
    <Icon variant="info" size="xs" className="ft-showcasetabs-tooltips-icon-color" />
  </span>
</Tooltip.caret>`}
              </pre>
              <T.body size="sm"><strong>Props:</strong> Default hover trigger</T.body>
            </div>

            {/* Style 9 */}
            <div>
              <T.h3 weight="semibold">9. Click-to-Toggle Icon Tooltip</T.h3>
              <T.body size="sm"><strong>VR:</strong> Tooltip.caret</T.body>
              <T.body size="sm"><strong>Usage:</strong> Click to toggle tooltip on/off, stays open until clicked again</T.body>
              <pre className="ft-showcasetabs-tooltips-code-block">
{`<Tooltip.caret content="Click to toggle this tooltip on and off"
  size="sm" side="top" trigger="click">
  <Icon variant="info" size="md"
    className="ft-showcasetabs-tooltips-icon-accent" />
</Tooltip.caret>`}
              </pre>
              <T.body size="sm"><strong>Props:</strong> trigger=&quot;click&quot; (without closeOnMouseLeave)</T.body>
            </div>

            {/* Style 10 */}
            <div>
              <T.h3 weight="semibold">10. Hover-to-Show, Click-to-Dismiss Icon Tooltip</T.h3>
              <T.body size="sm"><strong>VR:</strong> Tooltip.caret</T.body>
              <T.body size="sm"><strong>Usage:</strong> Tooltip appears on hover but dismisses when icon is clicked</T.body>
              <pre className="ft-showcasetabs-tooltips-code-block">
{`<Tooltip.caret content="..." size="sm" side="top" dismissOnClick={true}>
  <Icon variant="alert-circle" size="md"
    className="ft-showcasetabs-tooltips-icon-warning" />
</Tooltip.caret>`}
              </pre>
              <T.body size="sm"><strong>Props:</strong> dismissOnClick={'{true}'} - Hover shows, click dismisses</T.body>
            </div>
          </div>

          <div className="ft-showcasetabs-tooltips-props-summary">
            <T.h3 weight="semibold">Key Props Summary</T.h3>
            <ul className="ft-showcasetabs-tooltips-props-list">
              <li><T.body><strong>size:</strong> &quot;sm&quot; | &quot;md&quot; | &quot;lg&quot; (default: &quot;sm&quot;)</T.body></li>
              <li><T.body><strong>side:</strong> &quot;top&quot; | &quot;bottom&quot; | &quot;left&quot; | &quot;right&quot; (default: &quot;top&quot;)</T.body></li>
              <li><T.body><strong>trigger:</strong> &quot;hover&quot; | &quot;click&quot; (default: &quot;hover&quot;)</T.body></li>
              <li><T.body><strong>closeOnMouseLeave:</strong> boolean - Use with trigger=&quot;click&quot; to close on mouse leave (default: false)</T.body></li>
              <li><T.body><strong>dismissOnClick:</strong> boolean - Tooltip shows on hover but dismisses when clicked (default: false)</T.body></li>
              <li><T.body><strong>followCursor:</strong> boolean - Tooltip follows mouse cursor (default: false)</T.body></li>
              <li><T.body><strong>fullWidth:</strong> boolean - Makes tooltip wrapper full width (default: false)</T.body></li>
            </ul>
          </div>
        </div>
      </div>
    </Card.standard>
  );
}
