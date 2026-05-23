'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Country, State, City } from 'country-state-city';
import {
  createTenantsApi,
  saveTenantConfigurationDraft,
  TENANT_ID_PREFIX_HINT,
  type TenantPortal,
} from '@/lib/tenants-api';
import { TenantFlowBreadcrumbs } from '@/tenant/components/TenantFlowBreadcrumbs';
import neoToast from '@/lib/toast';
import '@/tenant/styles/register-tenant.css';

const tenantTypes = [
  'UNIVERSITY',
  'COLLEGE',
  'CORPORATE',
  'SKILL_ACADEMY',
  'NGO',
  'GOVERNMENT',
  'BOOTCAMP',
  'SCHOOL',
];

const platformPurposes = [
  'Learning Management',
  'Student Lifecycle Management',
  'Corporate Training',
  'Employee Upskilling',
  'Placement and Employability',
  'Skill Development',
  'Academic Programme Delivery',
  'Certification Management',
  'Assessment and Examination',
  'Attendance and Progress Tracking',
  'Compliance Training',
  'Onboarding and Orientation',
  'Faculty and Trainer Management',
  'Batch and Cohort Management',
  'Internship and Placement Tracking',
  'Government Training Initiatives',
  'Vocational Training',
  'School Learning Management',
  'Bootcamp Programme Delivery',
  'Hybrid and Online Learning',
  'Learning Analytics and Reporting',
  'Multi-campus Administration',
  'Career Development',
  'Talent Development',
  'Content and Course Delivery',
];

const programmeCategories = [
  'Academic Programmes',
  'Corporate Learning',
  'Technical Training',
  'Professional Certification',
  'Vocational Courses',
  'Competitive Exam Training',
  'Soft Skills Training',
  'Placement Preparation',
  'Leadership Development',
  'Teacher / Faculty Development',
  'Healthcare Training',
  'Government Skill Programmes',
  'Language Training',
  'Entrepreneurship Programmes',
  'Compliance and Policy Training',
  'Hybrid Learning Programmes',
  'Online Learning Programmes',
];

const programmesOfferedOptions = [
  'Engineering and Technology',
  'Arts and Humanities',
  'Commerce and Finance',
  'Management and Business',
  'Science and Research',
  'Healthcare and Life Sciences',
  'Computer Applications and IT',
  'Design and Multimedia',
  'Hospitality and Tourism',
  'Law and Legal Studies',
  'Education and Teacher Training',
  'Vocational and Skill Development',
  'Corporate and Professional Training',
  'Software and IT Training',
  'Data Science and AI',
  'Cybersecurity Training',
  'Cloud and DevOps Training',
  'Digital Marketing',
  'Placement and Employability Training',
  'Soft Skills and Communication',
  'Leadership and Management',
  'Competitive Exam Coaching',
  'Government Skill Development',
  'Entrepreneurship Development',
  'Language and Communication Training',
  'Online Certification Programmes',
  'Hybrid Learning Programmes',
];

const expectedUserRanges = ['1-100', '101-500', '501-1000', '1001-5000', '5000+'];

type Props = {
  basePath: '/superadmin' | '/platform-admin';
  portal: TenantPortal;
};

export function RegisterTenantForm({ basePath, portal }: Props) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    tenantId: '',
    tenantName: '',
    tenantType: '',
    countryCode: '',
    country: '',
    stateCode: '',
    state: '',
    city: '',
    contactPersonName: '',
    contactEmail: '',
    contactMobile: '',
    alternateContactPersonName: '',
    alternateContactEmail: '',
    alternateContactMobile: '',
    platformPurpose: '',
    programmeCategory: '',
    programmesOffered: '',
    expectedUsers: '',
    subscriptionPlan: '',
    status: 'ACTIVE',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingTenantId, setLoadingTenantId] = useState(false);

  const tenantsApi = useMemo(() => createTenantsApi(portal), [portal]);

  useEffect(() => {
    if (!formData.tenantType) {
      setFormData((previous) => ({ ...previous, tenantId: '' }));
      return;
    }

    let cancelled = false;
    setLoadingTenantId(true);

    tenantsApi
      .getNextTenantId(formData.tenantType)
      .then(({ data }) => {
        if (!cancelled) {
          setFormData((previous) => ({ ...previous, tenantId: data.tenantId }));
        }
      })
      .catch(() => {
        if (!cancelled) neoToast.error('Could not generate tenant ID.');
      })
      .finally(() => {
        if (!cancelled) setLoadingTenantId(false);
      });

    return () => {
      cancelled = true;
    };
  }, [formData.tenantType, tenantsApi]);

  const countries = Country.getAllCountries();
  const states = formData.countryCode ? State.getStatesOfCountry(formData.countryCode) : [];
  const cities =
    formData.countryCode && formData.stateCode
      ? City.getCitiesOfState(formData.countryCode, formData.stateCode)
      : [];

  function persistDraft() {
    if (formData.tenantId || formData.tenantName || formData.tenantType) {
      saveTenantConfigurationDraft({
        tenantId: formData.tenantId,
        tenantName: formData.tenantName,
        tenantType: formData.tenantType,
      });
    }
  }

  function handleConfigureTenant() {
    persistDraft();
    router.push(`${basePath}/tenant/configuration`);
  }

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    setFormData((previous) => {
      if (name === 'countryCode') {
        const selectedCountry = countries.find((country) => country.isoCode === value);
        return {
          ...previous,
          countryCode: value,
          country: selectedCountry?.name || '',
          stateCode: '',
          state: '',
          city: '',
        };
      }

      if (name === 'stateCode') {
        const selectedState = states.find((state) => state.isoCode === value);
        return {
          ...previous,
          stateCode: value,
          state: selectedState?.name || '',
          city: '',
        };
      }

      if (name === 'tenantId') return previous;
      return { ...previous, [name]: value };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.tenantType || !formData.tenantId || loadingTenantId) {
      neoToast.error('Select a tenant type and wait for the tenant ID to be generated.');
      return;
    }

    try {
      setIsSubmitting(true);

      await tenantsApi.createTenant({
        tenantId: formData.tenantId,
        tenantName: formData.tenantName,
        tenantType: formData.tenantType,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        contactPersonName: formData.contactPersonName,
        contactEmail: formData.contactEmail,
        contactMobile: formData.contactMobile,
        alternateContactPersonName: formData.alternateContactPersonName || undefined,
        alternateContactEmail: formData.alternateContactEmail || undefined,
        alternateContactMobile: formData.alternateContactMobile || undefined,
        platformPurpose: formData.platformPurpose,
        programmeCategory: formData.programmeCategory,
        programmesOffered: formData.programmesOffered,
        expectedUsers: formData.expectedUsers,
        subscriptionPlan: formData.subscriptionPlan,
        status: formData.status,
      });

      saveTenantConfigurationDraft({
        tenantId: formData.tenantId,
        tenantName: formData.tenantName,
        tenantType: formData.tenantType,
      });

      neoToast.success('Tenant registered. Continue with configuration.');
      router.push(`${basePath}/tenant/configuration`);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message || 'Tenant registration failed.';
      neoToast.error(Array.isArray(message) ? message[0] : String(message));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="tenantPage">
      <TenantFlowBreadcrumbs basePath={basePath} current="register" />

      <section className="tenantCard tenantHeader">
        <h1 className="tenantTitle">Register Tenant</h1>
      </section>

      <form onSubmit={handleSubmit} className="tenantCard tenantForm">
        <h2 className="tenantSectionTitle">Tenant Details</h2>

        <div className="tenantGrid">
          <div className="tenantField">
            <label>Tenant Type</label>
            <select name="tenantType" value={formData.tenantType} onChange={handleChange} required>
              <option value="">Select tenant type</option>
              {tenantTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {formData.tenantType ? (
            <div className="tenantField">
              <label>Tenant ID</label>
              <input
                name="tenantId"
                value={loadingTenantId ? 'Generating…' : formData.tenantId}
                readOnly
                disabled={loadingTenantId}
                className="tenantIdReadonly"
                required
              />
              <p className="tenantIdHint">
                Auto-generated · format {TENANT_ID_PREFIX_HINT[formData.tenantType] ?? 'LXP-XXX-###'}
              </p>
            </div>
          ) : null}

          <div className="tenantField">
            <label>Tenant Name</label>
            <input
              name="tenantName"
              value={formData.tenantName}
              onChange={handleChange}
              placeholder="ABC University"
              required
            />
          </div>

          <div className="tenantField">
            <label>Country</label>
            <select name="countryCode" value={formData.countryCode} onChange={handleChange} required>
              <option value="">Select country</option>
              {countries.map((country) => (
                <option key={country.isoCode} value={country.isoCode}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div className="tenantField">
            <label>State</label>
            <select
              name="stateCode"
              value={formData.stateCode}
              onChange={handleChange}
              disabled={!formData.countryCode}
              required
            >
              <option value="">Select state</option>
              {states.map((state) => (
                <option key={state.isoCode} value={state.isoCode}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          <div className="tenantField">
            <label>City / District</label>
            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
              disabled={!formData.stateCode}
              required
            >
              <option value="">Select city</option>
              {cities.map((city) => (
                <option
                  key={`${city.name}-${city.latitude}-${city.longitude}`}
                  value={city.name}
                >
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <h2 className="tenantSectionTitle">Primary Contact Details</h2>

        <div className="tenantGrid">
          <div className="tenantField">
            <label>Contact Person Name</label>
            <input
              name="contactPersonName"
              value={formData.contactPersonName}
              onChange={handleChange}
              placeholder="Admin Name"
              required
            />
          </div>

          <div className="tenantField">
            <label>Contact Email</label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className="tenantField">
            <label>Contact Mobile</label>
            <input
              name="contactMobile"
              value={formData.contactMobile}
              onChange={handleChange}
              placeholder="9876543210"
              required
            />
          </div>
        </div>

        <h2 className="tenantSectionTitle">Alternate Contact Details</h2>

        <div className="tenantGrid">
          <div className="tenantField">
            <label>Alternate Contact Name</label>
            <input
              name="alternateContactPersonName"
              value={formData.alternateContactPersonName}
              onChange={handleChange}
              placeholder="Alternate Contact Name"
            />
          </div>

          <div className="tenantField">
            <label>Alternate Contact Email</label>
            <input
              type="email"
              name="alternateContactEmail"
              value={formData.alternateContactEmail}
              onChange={handleChange}
              placeholder="alternate@example.com"
            />
          </div>

          <div className="tenantField">
            <label>Alternate Contact Mobile</label>
            <input
              name="alternateContactMobile"
              value={formData.alternateContactMobile}
              onChange={handleChange}
              placeholder="9876543211"
            />
          </div>
        </div>

        <h2 className="tenantSectionTitle">Platform Requirement</h2>

        <div className="tenantGrid">
          <div className="tenantField">
            <label>Platform Purpose</label>
            <select
              name="platformPurpose"
              value={formData.platformPurpose}
              onChange={handleChange}
              required
            >
              <option value="">Select purpose</option>
              {platformPurposes.map((purpose) => (
                <option key={purpose} value={purpose}>
                  {purpose}
                </option>
              ))}
            </select>
          </div>

          <div className="tenantField">
            <label>Programme Category</label>
            <select
              name="programmeCategory"
              value={formData.programmeCategory}
              onChange={handleChange}
              required
            >
              <option value="">Select programme category</option>
              {programmeCategories.map((programme) => (
                <option key={programme} value={programme}>
                  {programme}
                </option>
              ))}
            </select>
          </div>

          <div className="tenantField">
            <label>Programmes / Trainings Offered</label>
            <select
              name="programmesOffered"
              value={formData.programmesOffered}
              onChange={handleChange}
              required
            >
              <option value="">Select programme / training</option>
              {programmesOfferedOptions.map((programme) => (
                <option key={programme} value={programme}>
                  {programme}
                </option>
              ))}
            </select>
          </div>

          <div className="tenantField">
            <label>Expected Users</label>
            <select
              name="expectedUsers"
              value={formData.expectedUsers}
              onChange={handleChange}
              required
            >
              <option value="">Select expected users</option>
              {expectedUserRanges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </div>

          <div className="tenantField">
            <label>Subscription Plan</label>
            <select
              name="subscriptionPlan"
              value={formData.subscriptionPlan}
              onChange={handleChange}
              required
            >
              <option value="">Select plan</option>
              <option value="TRIAL">TRIAL</option>
              <option value="BASIC">BASIC</option>
              <option value="PROFESSIONAL">PROFESSIONAL</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
            </select>
          </div>

          <div className="tenantField">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="ON_HOLD">ON_HOLD</option>
            </select>
          </div>
        </div>

        <div className="tenantActions">
          <button type="submit" className="tenantButton" disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Register Tenant'}
          </button>

          <button
            type="button"
            className="tenantButton secondaryTenantButton"
            onClick={handleConfigureTenant}
          >
            Configure Tenant
          </button>
        </div>
      </form>
    </main>
  );
}
