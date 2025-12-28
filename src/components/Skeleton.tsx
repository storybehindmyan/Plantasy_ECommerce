import clsx from 'clsx';

const Skeleton = ({ className }: { className?: string }) => {
    return (
        <div className={clsx("animate-pulse bg-gray-200 rounded", className)} />
    );
};

export default Skeleton;
