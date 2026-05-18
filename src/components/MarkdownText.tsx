import ReactMarkdown from 'react-markdown';
import { useDetailNav, refAusId } from '../lib/detail-navigation';

interface Props {
  text: string;
  className?: string;
}

export function MarkdownText({ text, className }: Props) {
  const nav = useDetailNav();
  return (
    <div className={`markdown-body ${className ?? ''}`}>
      <ReactMarkdown
        components={{
          a({ href, children, ...rest }) {
            const ref = href ? refAusId(href) : null;
            if (ref) {
              return (
                <a
                  href="#"
                  className="md-internal-link"
                  onClick={(e) => { e.preventDefault(); nav.oeffne(ref); }}
                >
                  {children}
                </a>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
                {children}
              </a>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
