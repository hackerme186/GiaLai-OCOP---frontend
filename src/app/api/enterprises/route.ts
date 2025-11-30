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
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Build Supabase query string
    // First, try a simple query without filters to see if we can get any data
    const queryParts: string[] = [];
    queryParts.push("select=*");
    queryParts.push(`limit=${limit}`);
    queryParts.push(`offset=${offset}`);
    
    // Get filter parameters
    const search = searchParams.get("search");
    const field = searchParams.get("field");
    const status = searchParams.get("status");
    
    // Add filters if provided
    // For PostgREST with case-sensitive columns, column names need to be quoted
    // Format in URL: %22ColumnName%22=operator.value
    if (status && status.trim()) {
      // Status filter - try with quoted column name
      const statusValue = encodeURIComponent(status.trim());
      queryParts.push(`%22Status%22=eq.${statusValue}`);
    }
    
    if (search && search.trim()) {
      // Search filter - PostgREST uses * as wildcard for ilike
      const searchValue = encodeURIComponent(search.trim());
      queryParts.push(`%22Name%22=ilike.*${searchValue}*`);
    }
    
    if (field && field.trim()) {
      const fieldValue = encodeURIComponent(field.trim());
      queryParts.push(`%22BusinessField%22=ilike.*${fieldValue}*`);
    }

    // Use the correct table name: 'Enterprises' (with capital E)
    const tableName = 'Enterprises';
    
    try {
      // First, try a simple query without any filters to test if we can get data
      const simpleQuery = `select=*&limit=${limit}&offset=${offset}`;
      const simpleUrl = `${SUPABASE_URL}/rest/v1/${tableName}?${simpleQuery}`;
      
      console.log('=== Testing simple query (no filters) ===');
      console.log('Simple URL:', simpleUrl);
      
      const simpleResponse = await fetch(simpleUrl, {
        method: "GET",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "count=exact",
        },
      });
      
      let simpleData: any[] = [];
      let simpleTotal = 0;
      
      if (simpleResponse.ok) {
        simpleData = await simpleResponse.json();
        const contentRange = simpleResponse.headers.get("content-range");
        if (contentRange) {
          const parts = contentRange.split("/");
          if (parts.length > 1) {
            simpleTotal = parseInt(parts[1]) || simpleData.length;
          }
        } else {
          simpleTotal = Array.isArray(simpleData) ? simpleData.length : 0;
        }
        console.log('Simple query result:', {
          count: Array.isArray(simpleData) ? simpleData.length : 0,
          total: simpleTotal,
          hasData: Array.isArray(simpleData) && simpleData.length > 0,
          firstItem: Array.isArray(simpleData) && simpleData.length > 0 ? simpleData[0] : null,
          contentRange: contentRange
        });
      } else {
        const errorText = await simpleResponse.text();
        console.error('Simple query error:', {
          status: simpleResponse.status,
          statusText: simpleResponse.statusText,
          error: errorText
        });
        // If simple query fails, we should still try to return something
        // but log the error clearly
      }
      
      // If we have filters, try query with filters
      // But if simple query has data and filter query fails, use simple query result
      const hasFilters = (status && status.trim()) || (search && search.trim()) || (field && field.trim());
      
      if (hasFilters) {
        const queryString = queryParts.join("&");
        const url = `${SUPABASE_URL}/rest/v1/${tableName}?${queryString}`;
        
        console.log('=== Query with Filters ===');
        console.log('Query string:', queryString);
        console.log('Full URL:', url);
        console.log('Filters:', { search, field, status });
        
        const response = await fetch(url, {
          method: "GET",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "count=exact",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const contentRange = response.headers.get("content-range");
          let total = 0;
          if (contentRange) {
            const parts = contentRange.split("/");
            if (parts.length > 1) {
              total = parseInt(parts[1]) || (Array.isArray(data) ? data.length : 0);
            }
          } else {
            total = Array.isArray(data) ? data.length : 0;
          }
          
          console.log('Filter query result:', {
            count: Array.isArray(data) ? data.length : 0,
            total: total
          });
          
          // If filter query returns data, use it; otherwise fallback to simple query
          if (Array.isArray(data) && data.length > 0) {
            return NextResponse.json({
              items: data,
              total: total,
              page: page,
              limit: limit,
            });
          } else if (simpleData.length > 0) {
            // Filter returned no results but simple query has data
            // This means filters are too restrictive or filter format is wrong
            console.warn('Filter query returned no results, but simple query has data. Using simple query result.');
            // Filter the simple data client-side as fallback
            let filtered = [...simpleData];
            if (status && status.trim()) {
              filtered = filtered.filter(item => 
                (item.Status || item.status || '').toLowerCase() === status.trim().toLowerCase()
              );
            }
            if (search && search.trim()) {
              const searchLower = search.trim().toLowerCase();
              filtered = filtered.filter(item => 
                (item.Name || item.name || '').toLowerCase().includes(searchLower)
              );
            }
            if (field && field.trim()) {
              const fieldLower = field.trim().toLowerCase();
              filtered = filtered.filter(item => 
                (item.BusinessField || item.businessField || '').toLowerCase().includes(fieldLower)
              );
            }
            return NextResponse.json({
              items: filtered,
              total: filtered.length,
              page: page,
              limit: limit,
            });
          }
        } else {
          const errorText = await response.text();
          console.error(`Filter query error:`, response.status, errorText);
          // If filter query fails but simple query has data, use simple query
          if (simpleData.length > 0) {
            console.warn('Filter query failed, using simple query result');
            return NextResponse.json({
              items: simpleData,
              total: simpleTotal,
              page: page,
              limit: limit,
            });
          }
        }
      }
      
      // Return simple query result (no filters or filter query had no results)
      // Include debug info in development
      const responseData = {
        items: Array.isArray(simpleData) ? simpleData : [],
        total: simpleTotal,
        page: page,
        limit: limit,
      };
      
      // Add debug info in development mode
      if (process.env.NODE_ENV === 'development') {
        (responseData as any).debug = {
          simpleQueryUrl: simpleUrl,
          simpleQueryCount: Array.isArray(simpleData) ? simpleData.length : 0,
          hasFilters: hasFilters,
          tableName: tableName,
        };
      }
      
      return NextResponse.json(responseData);
    } catch (err) {
      const lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`Error fetching from ${tableName}:`, lastError);
      return NextResponse.json(
        { 
          error: "Failed to fetch enterprises from Supabase", 
          message: lastError.message || "Unknown error",
          items: [],
          total: 0,
          page: page,
          limit: limit,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching enterprises:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

