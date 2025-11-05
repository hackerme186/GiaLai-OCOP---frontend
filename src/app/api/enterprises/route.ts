import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase config missing:', {
        hasUrl: !!SUPABASE_URL,
        hasKey: !!SUPABASE_ANON_KEY,
        url: SUPABASE_URL,
      });
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }
    
    console.log('Supabase config loaded:', {
      url: SUPABASE_URL,
      hasKey: !!SUPABASE_ANON_KEY,
    });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const requestedLimit = parseInt(searchParams.get("limit") || "10");
    
    // Check if we have any filters
    const hasFilters = !!(
      searchParams.get("search")?.trim() ||
      searchParams.get("province")?.trim() ||
      searchParams.get("district")?.trim() ||
      searchParams.get("field")?.trim() ||
      searchParams.get("status")?.trim()
    );
    
    // If we have filters, fetch more data to filter client-side
    // Otherwise use normal pagination
    const fetchLimit = hasFilters ? 1000 : requestedLimit;
    const offset = hasFilters ? 0 : (page - 1) * requestedLimit;

    // Build Supabase query - Start with base params
    const queryParts: string[] = [];
    queryParts.push("select=*");
    queryParts.push(`limit=${fetchLimit}`);
    queryParts.push(`offset=${offset}`);
    
    // Add filters if provided - Supabase PostgREST format
    // Format: column.ilike.%value% (wildcards use % which needs to be encoded as %25)
    
    const search = searchParams.get("search");
    if (search && search.trim()) {
      // Encode the search term, then add wildcards
      const searchTerm = encodeURIComponent(search.trim());
      queryParts.push(`Name.ilike.%25${searchTerm}%25`);
    }
    
    const province = searchParams.get("province");
    if (province && province.trim()) {
      const provinceTerm = encodeURIComponent(province.trim());
      queryParts.push(`province.ilike.%25${provinceTerm}%25`);
    }
    
    const district = searchParams.get("district");
    if (district && district.trim()) {
      const districtTerm = encodeURIComponent(district.trim());
      queryParts.push(`district.ilike.%25${districtTerm}%25`);
    }
    
    const field = searchParams.get("field");
    if (field && field.trim()) {
      const fieldTerm = encodeURIComponent(field.trim());
      queryParts.push(`BusinessField.ilike.%25${fieldTerm}%25`);
    }
    
    const status = searchParams.get("status");
    if (status && status.trim()) {
      const statusTerm = encodeURIComponent(status.trim());
      queryParts.push(`status.ilike.%25${statusTerm}%25`);
    }

    // Try both table name cases - Start with 'Enterprises' (uppercase) as suggested by error
    const tableNames = ['Enterprises', 'enterprises'];
    let lastError: Error | null = null;
    
    for (const tableName of tableNames) {
      try {
        // Build query string - try simpler approach first if filters cause issues
        let queryString = queryParts.join("&");
        
        // If query is too complex, try without filters first
        if (queryParts.length > 3) {
          // Try basic query first (just select, limit, offset)
          const basicQuery = `select=*&limit=${fetchLimit}&offset=${offset}`;
          const basicUrl = `${SUPABASE_URL}/rest/v1/${tableName}?${basicQuery}`;
          
          console.log(`Trying basic query for ${tableName}:`, basicUrl);
          
          const basicResponse = await fetch(basicUrl, {
            method: "GET",
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
              Prefer: "count=exact",
            },
          });
          
          if (basicResponse.ok) {
            // If basic query works, try with filters
            console.log(`Basic query successful, trying with filters for ${tableName}`);
          } else {
            // If basic query fails, table might not exist
            const errorText = await basicResponse.text();
            console.error(`Basic query failed for ${tableName}:`, basicResponse.status, errorText);
            if (basicResponse.status === 404 && tableName === 'Enterprises') {
              lastError = new Error(`HTTP ${basicResponse.status}: ${errorText}`);
              continue;
            }
          }
        }
        
        const url = `${SUPABASE_URL}/rest/v1/${tableName}?${queryString}`;
        console.log(`Fetching from ${tableName}:`, url.substring(0, 200) + '...'); // Log truncated URL
        
        const response = await fetch(url, {
          method: "GET",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "count=exact",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          // Truncate error text if it's HTML (Cloudflare error page)
          const shortError = errorText.length > 500 ? errorText.substring(0, 500) + '...' : errorText;
          console.error(`Supabase API error for ${tableName}:`, response.status, shortError);
          
          // If 500 error and we have filters, try without filters and filter client-side
          if (response.status === 500 && queryParts.length > 3) {
            console.log(`500 error with filters, trying without filters for ${tableName}`);
            const basicQuery = `select=*&limit=1000&offset=0`; // Get more to filter client-side
            const basicUrl = `${SUPABASE_URL}/rest/v1/${tableName}?${basicQuery}`;
            
            try {
              const basicResponse = await fetch(basicUrl, {
                method: "GET",
                headers: {
                  apikey: SUPABASE_ANON_KEY,
                  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                  "Content-Type": "application/json",
                  Prefer: "count=exact",
                },
              });
              
              if (basicResponse.ok) {
                const allData = await basicResponse.json();
                // Filter client-side
                let filtered = Array.isArray(allData) ? allData : [];
                
                const search = searchParams.get("search");
                if (search && search.trim()) {
                  const searchLower = search.trim().toLowerCase();
                  filtered = filtered.filter((item: any) => 
                    (item.name || item.Name || '').toLowerCase().includes(searchLower)
                  );
                }
                
                const province = searchParams.get("province");
                if (province && province.trim()) {
                  const provinceLower = province.trim().toLowerCase();
                  filtered = filtered.filter((item: any) => 
                    (item.province || '').toLowerCase().includes(provinceLower)
                  );
                }
                
                const district = searchParams.get("district");
                if (district && district.trim()) {
                  const districtLower = district.trim().toLowerCase();
                  filtered = filtered.filter((item: any) => 
                    (item.district || '').toLowerCase().includes(districtLower)
                  );
                }
                
                const field = searchParams.get("field");
                if (field && field.trim()) {
                  const fieldLower = field.trim().toLowerCase();
                  filtered = filtered.filter((item: any) => 
                    (item.businessField || item.BusinessField || '').toLowerCase().includes(fieldLower)
                  );
                }
                
                const status = searchParams.get("status");
                if (status && status.trim()) {
                  const statusLower = status.trim().toLowerCase();
                  filtered = filtered.filter((item: any) => 
                    (item.status || '').toLowerCase().includes(statusLower)
                  );
                }
                
                // Apply pagination after filtering
                const total = filtered.length;
                const actualOffset = hasFilters ? (page - 1) * requestedLimit : offset;
                const actualLimit = hasFilters ? requestedLimit : fetchLimit;
                const paginated = filtered.slice(actualOffset, actualOffset + actualLimit);
                
                console.log(`Client-side filtering successful: ${total} total, showing ${paginated.length} on page ${page}`);
                
                return NextResponse.json({
                  items: paginated,
                  total: total,
                  page: page,
                  limit: requestedLimit,
                });
              }
            } catch (basicErr) {
              console.error(`Basic query also failed:`, basicErr);
            }
          }
          
          // If 404 and trying lowercase, that's the last attempt
          if (response.status === 404 && tableName === 'enterprises') {
            lastError = new Error(`HTTP ${response.status}: Table not found`);
            break;
          }
          
          // If 404 or 500 and trying uppercase, try lowercase next
          if ((response.status === 404 || response.status === 500) && tableName === 'Enterprises') {
            lastError = new Error(`HTTP ${response.status}: ${shortError}`);
            continue;
          }
          
          // For 500 errors, try next table name
          if (response.status === 500) {
            lastError = new Error(`HTTP ${response.status}: Server error - ${shortError}`);
            continue;
          }
          
          lastError = new Error(`HTTP ${response.status}: ${shortError}`);
          continue;
        }

        let data = await response.json();
        if (!Array.isArray(data)) {
          data = [];
        }
        
        // Always apply client-side filtering to ensure accuracy
        // (in case Supabase query didn't apply filters correctly)
        let filtered = [...data];
        
        const search = searchParams.get("search");
        if (search && search.trim()) {
          const searchLower = search.trim().toLowerCase();
          filtered = filtered.filter((item: any) => {
            const name = (item.name || item.Name || '').toLowerCase();
            const description = (item.description || item.Description || '').toLowerCase();
            return name.includes(searchLower) || description.includes(searchLower);
          });
        }
        
        const province = searchParams.get("province");
        if (province && province.trim()) {
          const provinceLower = province.trim().toLowerCase();
          filtered = filtered.filter((item: any) => 
            (item.province || '').toLowerCase().includes(provinceLower)
          );
        }
        
        const district = searchParams.get("district");
        if (district && district.trim()) {
          const districtLower = district.trim().toLowerCase();
          filtered = filtered.filter((item: any) => 
            (item.district || '').toLowerCase().includes(districtLower)
          );
        }
        
        const field = searchParams.get("field");
        if (field && field.trim()) {
          const fieldLower = field.trim().toLowerCase();
          filtered = filtered.filter((item: any) => {
            const businessField = (item.businessField || item.BusinessField || '').toLowerCase();
            return businessField.includes(fieldLower);
          });
        }
        
        const status = searchParams.get("status");
        if (status && status.trim()) {
          const statusLower = status.trim().toLowerCase();
          filtered = filtered.filter((item: any) => {
            const itemStatus = (item.status || '').toLowerCase();
            const isLocked = item.locked ? 'khóa' : 'hoạt động';
            return itemStatus.includes(statusLower) || isLocked.includes(statusLower);
          });
        }
        
        // Apply pagination after filtering
        const total = filtered.length;
        const actualOffset = hasFilters ? (page - 1) * requestedLimit : offset;
        const actualLimit = hasFilters ? requestedLimit : fetchLimit;
        const paginated = filtered.slice(actualOffset, actualOffset + actualLimit);
        
        console.log(`Filtered results: ${total} total (from ${data.length} fetched), showing ${paginated.length} on page ${page}`);
        
        return NextResponse.json({
          items: paginated,
          total: total,
          page: page,
          limit: requestedLimit,
        });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`Error fetching from ${tableName}:`, err);
        if (tableName === 'Enterprises') {
          // Try lowercase if uppercase fails
          continue;
        }
      }
    }
    
    // If all attempts failed
    return NextResponse.json(
      { 
        error: "Failed to fetch enterprises from Supabase", 
        message: lastError?.message || "Unknown error",
        items: [],
        total: 0,
        page: page,
        limit: requestedLimit,
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error fetching enterprises:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

