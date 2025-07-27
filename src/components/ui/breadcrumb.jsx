import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '../../lib/utils';

/**
 * Breadcrumb component for navigation.
 * @param {object} props - The component props.
 * @param {Array<{label: string, onClick?: function}>} props.paths - Array of path objects.
 * @param {string} [props.className] - Additional class names.
 */
const Breadcrumb = ({ paths, className }) => {
    return (
        <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
            {paths.map((path, index) => (
                <React.Fragment key={index}>
                    {index > 0 && <ChevronRight className="h-4 w-4" />}
                    {path.onClick ? (
                        <Button
                            variant="link"
                            className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                            onClick={path.onClick}
                        >
                            {path.label}
                        </Button>
                    ) : (
                        <span className="font-medium text-foreground">{path.label}</span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};

export default Breadcrumb;
