/**
 * Skeleton Loading Examples
 * 
 * This file demonstrates various skeleton loading patterns
 * implemented in Task 4.4 for reference and testing.
 */

import { Skeleton, SkeletonCard, SkeletonForm, SkeletonList } from '@/components/UI/Skeleton';

export const SkeletonExamples = () => {
  return (
    <div className="p-8 space-y-8 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-800">Skeleton Loading Examples</h1>

      {/* Basic Skeleton Variants */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Basic Skeleton Variants</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Text Variant</p>
            <Skeleton variant="text" width="60%" />
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Rectangular Variant</p>
            <Skeleton variant="rectangular" width="100%" height="100px" />
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Circular Variant</p>
            <Skeleton variant="circular" width="64px" height="64px" />
          </div>
        </div>
      </section>

      {/* Animation Types */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Animation Types</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Pulse Animation (Default)</p>
            <Skeleton animation="pulse" width="100%" height="40px" />
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Wave/Shimmer Animation</p>
            <Skeleton animation="wave" width="100%" height="40px" />
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">No Animation</p>
            <Skeleton animation="none" width="100%" height="40px" />
          </div>
        </div>
      </section>

      {/* Pre-built Components */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Pre-built Skeleton Components</h2>
        
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Skeleton Card</p>
            <SkeletonCard />
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Skeleton Form</p>
            <SkeletonForm />
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Skeleton List (3 items)</p>
            <SkeletonList items={3} />
          </div>
        </div>
      </section>

      {/* Table Skeleton */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Table Skeleton</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {[1, 2, 3, 4].map((i) => (
                  <th key={i} className="px-6 py-3 text-left">
                    <Skeleton variant="text" width="80px" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[1, 2, 3].map((row) => (
                <tr key={row}>
                  {[1, 2, 3, 4].map((col) => (
                    <td key={col} className="px-6 py-4">
                      <Skeleton variant="text" width="100%" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Complex Layout Example */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Complex Layout Example</h2>
        <div className="flex gap-4">
          <div className="w-1/3">
            <Skeleton variant="circular" width="80px" height="80px" className="mb-4" />
            <Skeleton variant="text" width="60%" className="mb-2" />
            <Skeleton variant="text" width="80%" />
          </div>
          <div className="flex-1 space-y-3">
            <Skeleton variant="rectangular" width="100%" height="120px" />
            <div className="flex gap-2">
              <Skeleton variant="rectangular" width="100px" height="36px" />
              <Skeleton variant="rectangular" width="100px" height="36px" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
